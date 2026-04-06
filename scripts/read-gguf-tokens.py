#!/usr/bin/env python3
"""
Read GGUF model files and extract token parameters using gguf library.
Integrates with launchConfig.json for model selection.
"""

import json
import os
import sys
from pathlib import Path

# Ensure UTF-8 encoding for stdout (fixes Windows terminal issues)
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
elif sys.stdout.encoding != 'utf-8':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

try:
    from gguf import GGUFReader
except ImportError:
    print("❌ Error: gguf library is not installed!")
    print("   Install it with: pip install gguf")
    sys.exit(1)


def load_models():
    """Load models from launchConfig.json"""
    config_path = Path(__file__).parent / 'launchConfig.json'
    
    if not config_path.exists():
        raise FileNotFoundError(f"launchConfig.json not found at {config_path}")
    
    with open(config_path, 'r', encoding='utf-8') as f:
        config = json.load(f)
    
    return config.get('models', [])


def select_model(models):
    """Display available models and get user selection"""
    print('\n' + '=' * 80)
    print('AVAILABLE MODELS')
    print('=' * 80)
    
    for model in models:
        print(f"\n[{model['id']}] {model['name']}")
        print(f"    {model['description']}")
        print(f"    File: {model['filename']}")
        
        if os.path.exists(model['path']):
            print(f"    Path: ✓ {model['path']}")
        else:
            print(f"    Path: ✗ {model['path']} (NOT FOUND)")
    
    print('\n' + '=' * 80)
    
    while True:
        try:
            choice = input("\nSelect model by number (or press Ctrl+C to exit): ").strip()
            model_id = int(choice)
            selected = next((m for m in models if m['id'] == model_id), None)
            
            if not selected:
                print(f"❌ Error: Invalid selection. Please choose a valid model number.")
                continue
            
            if not os.path.exists(selected['path']):
                print(f"❌ Error: Model file not found at {selected['path']}")
                continue
            
            return selected
        except ValueError:
            print(f"❌ Error: Please enter a valid number.")
            continue
        except KeyboardInterrupt:
            print("\n\nExiting...")
            sys.exit(0)


def extract_infrastructure_metrics(reader, model_name):
    """Extract key infrastructure metrics for llamaserver from GGUF"""
    metrics = {}
    
    # List of important metrics to extract
    important_keys = [
        'context_length', 'embedding_length', 'block_count', 'head_count',
        'head_count_kv', 'rope.freq_base', 'feed_forward_length', 'expert_count',
        'expert_used_count', 'architecture', 'quantization_version'
    ]
    
    try:
        # Extract values from fields using contents() method
        for field in reader.fields.values():
            key = field.name
            
            # Only include infrastructure-related fields
            if not any(metric in key.lower() for metric in important_keys):
                continue
            
            try:
                # Use contents() method to get actual values from the field
                if hasattr(field, 'contents') and callable(field.contents):
                    value = field.contents()
                    if value is not None:
                        # Clean up key name for display
                        display_key = key.replace(f'{model_name.lower()}.', '')
                        metrics[display_key] = value
            except Exception as e:
                pass
    except Exception as e:
        pass
    
    return metrics


def extract_token_parameters(model_path):
    """Extract token parameters and infrastructure config from GGUF file"""
    print(f"\n📖 Reading GGUF file...")
    
    try:
        reader = GGUFReader(model_path)
    except Exception as e:
        print(f"❌ Error reading GGUF file: {e}")
        return None, None, None, {}
    
    # Get model architecture name from GGUF
    model_arch = "unknown"
    try:
        model_arch = reader.get('general.architecture', 'qwen3vlmoe')
    except:
        pass
    
    # Extract categorized fields
    all_fields = {}
    token_fields = {}
    infrastructure_fields = extract_infrastructure_metrics(reader, model_arch)
    
    # Important token-related keywords
    token_keywords = ['eos', 'bos', 'token', 'stop', 'special', 'chat_template', 'unk', 'pad']
    
    # Fields to exclude (too large/not useful for manual inspection)
    exclude_keywords = ['merges', 'tokens']
    
    try:
        # Extract field values using contents() method
        for field in reader.fields.values():
            key = field.name
            
            # Skip excluded fields
            if any(x in key.lower() for x in exclude_keywords):
                continue
            
            # Skip infrastructure fields (we already have them)
            if any(metric in key.lower() for metric in [
                'context_length', 'embedding_length', 'block_count', 'head_count',
                'head_count_kv', 'rope.freq_base', 'feed_forward_length', 'expert_count',
                'expert_used_count', 'architecture', 'quantization_version'
            ]):
                continue
            
            # Get value from field using contents()
            value = None
            try:
                if hasattr(field, 'contents') and callable(field.contents):
                    value = field.contents()
            except:
                pass
            
            # Store the value
            all_fields[key] = value
            
            # Categorize token fields
            if any(x in key.lower() for x in token_keywords):
                token_fields[key] = value
    except Exception as e:
        print(f"⚠️  Error accessing fields: {e}")
    
    return token_fields, infrastructure_fields, all_fields, model_arch, reader


def format_value(value, max_length=100):
    """Format value for display, handling various types including numpy arrays and bytes"""
    import numpy as np
    
    # Handle None
    if value is None:
        return "[None]"
    
    # Handle numpy arrays
    if isinstance(value, np.ndarray):
        if value.size == 0:
            return "[]"
        
        # Extract string data (byte strings or unicode)
        if value.dtype.kind in ('S', 'U', 'O'):  # String or object types
            try:
                if value.size == 1:
                    v = value.flat[0]
                    if isinstance(v, bytes):
                        return v.decode('utf-8', errors='replace')
                    else:
                        return str(v)
                else:
                    # Multiple strings
                    strs = []
                    for v in value.flat:
                        if isinstance(v, bytes):
                            strs.append(v.decode('utf-8', errors='replace'))
                        else:
                            strs.append(str(v))
                    if len(strs) <= 3:
                        return ', '.join(strs)
                    else:
                        return ', '.join(strs[:3]) + f" ... ({len(strs)} total)"
            except:
                return str(value)
        
        # Numeric values
        if value.dtype.kind in ('i', 'u', 'f'):  # Integer, unsigned, float
            if value.size == 1:
                scalar = value.item()
                return str(scalar)
            elif value.size <= 5:
                return ', '.join(str(v) for v in value.flat)
            else:
                return ', '.join(str(v) for v in list(value.flat)[:5]) + f" ... ({value.size} total)"
        
        # Fallback for other types
        return str(value)
    
    # Handle bytes
    if isinstance(value, bytes):
        try:
            return value.decode('utf-8', errors='replace')
        except:
            return f"[{len(value)} bytes]"
    
    # Handle bytearray
    if isinstance(value, bytearray):
        try:
            return bytes(value).decode('utf-8', errors='replace')
        except:
            return f"[{len(value)} bytes]"
    
    # Handle lists/tuples
    if isinstance(value, (list, tuple)):
        if len(value) == 0:
            return "[]"
        if len(value) <= 5:
            return str(value)
        return f"[{', '.join(str(v) for v in value[:5])}, ... ({len(value)} total)]"
    
    # Handle strings
    if isinstance(value, str):
        if len(value) > max_length:
            return value[:max_length-3] + "..."
        return value
    
    # Handle numbers
    if isinstance(value, (int, float, bool)):
        return str(value)
    
    # Default: show class name
    return f"[{type(value).__name__}]"


def check_jinja2_template(reader):
    """Check for Jinja2 chat template in GGUF file"""
    try:
        # Look for tokenizer.chat_template field
        for field in reader.fields.values():
            if field.name == 'tokenizer.chat_template':
                template = field.contents()
                return template
    except Exception as e:
        pass
    return None


def display_results(model_config, token_fields, infrastructure_fields, all_fields, model_arch, jinja_template=None):
    """Display results with focus on llamaserver startup parameters"""
    print('\n' + '=' * 80)
    print('GGUF MODEL ANALYSIS - LLAMASERVER STARTUP CONFIG')
    print('=' * 80)
    
    # Model info
    print(f"\n📌 MODEL INFO")
    print(f"  Name: {model_config['name']}")
    print(f"  Description: {model_config['description']}")
    print(f"  Architecture: {model_arch}")
    
    # Jinja2 template check
    if jinja_template:
        print(f"\n📝 JINJA2 CHAT TEMPLATE")
        # Show first few lines of template
        template_lines = jinja_template.split('\n')
        if len(template_lines) > 5:
            print(f"  Template found ({len(template_lines)} lines):")
            for line in template_lines[:5]:
                print(f"    {line}")
            print(f"    ... ({len(template_lines) - 5} more lines)")
        else:
            print(f"  Template found ({len(template_lines)} lines):")
            for line in template_lines:
                print(f"    {line}")
    else:
        print(f"\n📝 JINJA2 CHAT TEMPLATE")
        print(f"  ❌ No Jinja2 template found in this model")
    
    # File info
    print(f"\n📂 FILE INFO")
    print(f"  Path: {model_config['path']}")
    file_size_mb = os.path.getsize(model_config['path']) / (1024 * 1024)
    print(f"  File Size: {file_size_mb:.2f} MB")
    
    # Infrastructure parameters (llamaserver startup config)
    if infrastructure_fields:
        print(f"\n⚙️  INFRASTRUCTURE PARAMETERS (for llamaserver startup)")
        print(f"  Architecture-critical configuration:\n")
        
        for key in sorted(infrastructure_fields.keys()):
            value = infrastructure_fields[key]
            formatted_value = format_value(value, max_length=80)
            print(f"    {key:35s}: {formatted_value}")
    else:
        print(f"\n⚙️  No infrastructure parameters found")
    
    # Token parameters
    if token_fields:
        print(f"\n🎯 TOKEN & SPECIAL PARAMETERS")
        print(f"  Token configuration:\n")
        
        for key in sorted(token_fields.keys()):
            value = token_fields[key]
            formatted_value = format_value(value, max_length=80)
            short_key = key.replace('tokenizer.ggml.', '')
            print(f"    {short_key:35s}: {formatted_value}")
    else:
        print(f"\n⚠️  No token-related fields found")
    
    # All fields summary (less important, at end)
    if all_fields:
        field_count = len(all_fields)
        print(f"\n📊 ALL METADATA FIELDS ({field_count} total)")
        print(f"  Complete field listing:\n")
        
        for i, key in enumerate(sorted(all_fields.keys()), 1):
            value = all_fields[key]
            value_type = type(value).__name__
            short_key = key.replace(model_arch.lower()+'.', '').replace('tokenizer.ggml.', '').replace('general.', '')
            formatted_value = format_value(value, max_length=50)
            print(f"    {i:2d}. {short_key:40s} - {formatted_value}")
    
    # Inference parameters from config
    if 'parameters' in model_config:
        print(f"\n🚀 LLAMASERVER RECOMMENDED PARAMETERS")
        params = model_config['parameters']
        print(f"  Inference settings:")
        print(f"    Temperature:     {params.get('temperature', 'N/A')}")
        print(f"    Top P:           {params.get('top_p', 'N/A')}")
        print(f"    Top K:           {params.get('top_k', 'N/A')}")
        print(f"    Repeat Penalty:  {params.get('repeat_penalty', 'N/A')}")
        print(f"    Context Size:    {params.get('ctx_size', 'N/A')}")
        print(f"    Max Tokens:      {params.get('n_predict', 'N/A')}")
        print(f"    CPU Threads:     {params.get('n_threads', 'N/A')}")
        print(f"    GPU Layers:      {params.get('n_gpu_layers', 'N/A')}")
        if params.get('flash_attn'):
            print(f"    Flash Attention: {params.get('flash_attn')}")
    
    print('\n' + '=' * 80)


def main():
    """Main entry point"""
    try:
        # Load and select model
        models = load_models()
        
        if not models:
            print("❌ Error: No models found in launchConfig.json")
            sys.exit(1)
        
        model_config = select_model(models)
        
        # Extract parameters
        token_fields, infrastructure_fields, all_fields, model_arch, reader = extract_token_parameters(model_config['path'])
        
        # Check for Jinja2 template
        jinja_template = check_jinja2_template(reader) if reader else None
        
        # Display results
        display_results(model_config, token_fields, infrastructure_fields, all_fields, model_arch, jinja_template)
        
    except KeyboardInterrupt:
        print("\n\nExiting...")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
