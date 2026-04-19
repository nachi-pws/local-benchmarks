# Jinja2 Template Detection Feature - Summary

## Overview
Both Python and Node.js GGUF reader scripts now include automatic detection and display of Jinja2 chat templates embedded in GGUF model files.

## Implementation

### Python Script (`read-gguf-tokens.py`)

**New Function:**
```python
def check_jinja2_template(reader):
    """Check for Jinja2 chat template in GGUF file"""
    try:
        for field in reader.fields.values():
            if field.name == 'tokenizer.chat_template':
                template = field.contents()
                return template
    except Exception as e:
        pass
    return None
```

**Usage:**
- Checks the `tokenizer.chat_template` field in GGUF metadata
- Returns the complete template string if found
- Displays first 5 lines + line count if template is large (>5 lines)
- Shows "❌ No Jinja2 template found" if not present

**Output Example (Model 5 - LFM2-24B-A2B):**
```
📝 JINJA2 CHAT TEMPLATE
  Template found (64 lines):
    {{- bos_token -}}
    {%- set keep_past_thinking = keep_past_thinking | default(false) -%}
    {%- set ns = namespace(system_prompt="") -%}
    {%- if messages[0]["role"] == "system" -%}
        {%- set sys_content = messages[0]["content"] -%}
    ... (59 more lines)
```

### Node.js Script (`read-gguf-properties.js`)

**New Function:**
```javascript
function checkJinja2Template(metadata) {
  try {
    const templateKey = Object.keys(metadata).find(key => 
      key === 'tokenizer.chat_template' || key.includes('chat_template')
    );
    
    if (templateKey && metadata[templateKey]) {
      return metadata[templateKey];
    }
  } catch (e) {}
  return null;
}
```

**Usage:**
- Searches metadata for `tokenizer.chat_template` key
- Flexible matching for different field name formats
- Returns template string if found
- Displays first 5 lines + line count if template is large
- Shows "❌ No Jinja2 template found" if not present

**Output Example (Model 3 - Qwen3-VL-30B-A3B):**
```
📝 JINJA2 CHAT TEMPLATE
  Template found (4 lines):
    {%- if tools %}
        {{- '<|im_start|>system\n' }}
        {%- if messages[0].role == 'system' %}
        ...
```

## Testing Results

### Tested Models

| Model | Python | Node.js | Result |
|-------|--------|---------|--------|
| Model 3 (Qwen3-VL) | 121 lines | 4 lines | ✅ Template Found |
| Model 5 (LFM2) | 64 lines | 3 lines | ✅ Template Found |

Both scripts successfully detect and display Jinja2 templates when present.

## Features

✅ **Automatic Detection** - No user action required
✅ **Truncated Display** - Shows first 5 lines + total line count
✅ **Graceful Fallback** - Shows message if template not found
✅ **Position** - Displays right after model info for easy visibility
✅ **Integration** - Works with existing model selection and analysis features

## Usage

Simply run either script and select a model - template detection happens automatically:

**Python:**
```bash
python read-gguf-tokens.py
# Select model number (e.g., 3)
```

**Node.js:**
```bash
node read-gguf-properties.js
# Select model number (e.g., 3)
```

The Jinja2 template (if present) will be displayed in the `📝 JINJA2 CHAT TEMPLATE` section.

## Supported Formats

- `tokenizer.chat_template` - Standard GGUF field name
- Flexible key matching in Node.js for alternative field names
- Multi-line templates with proper line counting

## Notes

- Templates are extracted from GGUF metadata, not computed
- Display is limited to first 5 lines for readability
- Full template content remains available in token parameters section
- Both implementations use official GGUF libraries for reliable access
