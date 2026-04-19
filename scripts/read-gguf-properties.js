#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { gguf } from '@huggingface/gguf';
import { loadLaunchConfig } from './config-loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Read GGUF model file and extract all properties, configs, and metadata
 * Using official @huggingface/gguf library for accurate value extraction
 */

/**
 * Load models from launchConfig.json
 */
function loadModels() {
  const config = loadLaunchConfig();
  return config.models || [];
}

/**
 * Display available models and get user selection
 */
async function selectModel(models) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log('\n' + '='.repeat(80));
    console.log('AVAILABLE MODELS');
    console.log('='.repeat(80));
    
    models.forEach((model, index) => {
      console.log(`\n[${model.id}] ${model.name}`);
      console.log(`    ${model.description}`);
      console.log(`    File: ${model.filename}`);
      const fileExists = fs.existsSync(model.path) ? '✓' : '✗';
      console.log(`    Path: ${fileExists} ${model.path}`);
    });

    console.log('\n' + '='.repeat(80));
    rl.question('\nSelect model by number (or press Ctrl+C to exit): ', (answer) => {
      rl.close();
      const id = parseInt(answer, 10);
      const selected = models.find(m => m.id === id);
      
      if (!selected) {
        console.error(`\nError: Invalid selection. Please choose a valid model number.`);
        process.exit(1);
      }
      
      if (!fs.existsSync(selected.path)) {
        console.error(`\nError: Model file not found at ${selected.path}`);
        process.exit(1);
      }
      
      resolve(selected);
    });
  });
}

/**
 * Extract metadata from GGUF file using @huggingface/gguf library
 */
async function readGGUFMetadata(filePath) {
  try {
    console.log(`📖 Reading GGUF file...`);
    
    // Open GGUF file with the library
    const reader = await gguf(filePath, { allowLocalFile: true });
    
    // Extract all metadata entries
    const metadata = {};
    for (const [key, value] of Object.entries(reader.metadata)) {
      metadata[key] = formatValue(value);
    }
    
    return {
      version: reader.metadata.version || 'unknown',
      metadata: metadata,
      headerInfo: {
        keyValueCount: reader.metadata.kv_count || 0,
        tensorCount: reader.metadata.tensor_count || 0,
      }
    };
  } catch (error) {
    console.warn(`⚠️  Error reading GGUF file: ${error.message}`);
    return null;
  }
}

/**
 * Check for Jinja2 chat template in GGUF metadata
 */
function checkJinja2Template(metadata) {
  try {
    // Look for tokenizer.chat_template key in metadata
    const templateKey = Object.keys(metadata).find(key => 
      key === 'tokenizer.chat_template' || key.includes('chat_template')
    );
    
    if (templateKey && metadata[templateKey]) {
      return metadata[templateKey];
    }
  } catch (e) {
    // Silent fail if template check fails
  }
  return null;
}

/**
 * Format values for display, handling various types
 */
function formatValue(value, maxLength = 100) {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return '[None]';
  }
  
  // Handle arrays
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }
    
    // For arrays of strings with metadata-like content
    if (typeof value[0] === 'string' && value.length <= 5) {
      return `[${value.join(', ')}]`;
    }
    
    // For long arrays, show first few and count
    if (value.length <= 5) {
      return `[${value.join(', ')}]`;
    } else {
      const preview = value.slice(0, 5).join(', ');
      return `[${preview}, ... (${value.length} total)]`;
    }
  }
  
  // Handle strings
  if (typeof value === 'string') {
    if (value.length > maxLength) {
      return value.substring(0, maxLength - 3) + '...';
    }
    return value;
  }
  
  // Handle numbers and booleans
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  
  // Handle objects (shouldn't happen with @huggingface/gguf, but just in case)
  if (typeof value === 'object') {
    try {
      const str = JSON.stringify(value);
      if (str.length > maxLength) {
        return str.substring(0, maxLength - 3) + '...';
      }
      return str;
    } catch {
      return '[Complex Object]';
    }
  }
  
  return String(value);
}

/**
 * Extract infrastructure and token parameters from metadata
 */
function extractInfrastructureMetrics(metadata) {
  const infrastructure = {};
  const tokens = {};
  const allMetadata = metadata;
  
  const infrastructureKeys = [
    'context_length', 'embedding_length', 'block_count', 'head_count',
    'head_count_kv', 'rope.freq_base', 'feed_forward_length', 'expert_count',
    'expert_used_count', 'architecture', 'quantization_version'
  ];
  
  const tokenKeys = [
    'eos', 'bos', 'token', 'stop', 'special', 'chat_template', 'unk', 'pad'
  ];
  
  for (const [key, value] of Object.entries(metadata)) {
    const lowerKey = key.toLowerCase();
    
    // Check if infrastructure parameter
    if (infrastructureKeys.some(x => lowerKey.includes(x))) {
      infrastructure[key] = value;
    }
    
    // Check if token parameter
    if (tokenKeys.some(x => lowerKey.includes(x))) {
      tokens[key] = value;
    }
  }
  
  return { infrastructure, tokens, allMetadata };
}

/**
 * Format and display results nicely
 */
function displayResults(data, filePath, modelConfig, jinja2Template) {
  console.log('\n' + '='.repeat(80));
  console.log('GGUF MODEL ANALYSIS - LLAMASERVER STARTUP CONFIG');
  console.log('='.repeat(80));
  
  if (modelConfig) {
    console.log(`\n📌 MODEL INFO`);
    console.log(`  Name: ${modelConfig.name}`);
    console.log(`  Description: ${modelConfig.description}`);
    if (modelConfig.architecture) {
      console.log(`  Architecture: ${modelConfig.architecture}`);
    } else {
      console.log(`  Architecture: unknown`);
    }
  }

  console.log(`\n📂 FILE INFO`);
  console.log(`  Path: ${filePath}`);
  const fileSize = fs.statSync(filePath).size;
  console.log(`  File Size: ${(fileSize / (1024 * 1024)).toFixed(2)} MB`);

  // Jinja2 template check
  if (jinja2Template) {
    console.log(`\n📝 JINJA2 CHAT TEMPLATE`);
    const templateLines = jinja2Template.split('\n');
    if (templateLines.length > 5) {
      console.log(`  Template found (${templateLines.length} lines):`);
      for (let i = 0; i < 5; i++) {
        console.log(`    ${templateLines[i]}`);
      }
      console.log(`    ... (${templateLines.length - 5} more lines)`);
    } else {
      console.log(`  Template found (${templateLines.length} lines):`);
      for (const line of templateLines) {
        console.log(`    ${line}`);
      }
    }
  } else {
    console.log(`\n📝 JINJA2 CHAT TEMPLATE`);
    console.log(`  ❌ No Jinja2 template found in this model`);
  }

  if (data && data.metadata) {
    const { infrastructure, tokens, allMetadata } = extractInfrastructureMetrics(data.metadata);
    
    // Display infrastructure parameters
    if (Object.keys(infrastructure).length > 0) {
      console.log(`\n⚙️  INFRASTRUCTURE PARAMETERS (for llamaserver startup)`);
      console.log(`  Architecture-critical configuration:\n`);
      
      const sortedKeys = Object.keys(infrastructure).sort();
      for (const key of sortedKeys) {
        const value = infrastructure[key];
        console.log(`    ${key.padEnd(40)}: ${value}`);
      }
    }
    
    // Display token parameters
    if (Object.keys(tokens).length > 0) {
      console.log(`\n🎯 TOKEN & SPECIAL PARAMETERS`);
      console.log(`  Token configuration:\n`);
      
      const sortedKeys = Object.keys(tokens).sort();
      for (const key of sortedKeys) {
        const value = tokens[key];
        console.log(`    ${key.padEnd(40)}: ${value}`);
      }
    }
    
    // Display all metadata fields
    if (Object.keys(allMetadata).length > 0) {
      console.log(`\n📊 ALL METADATA FIELDS (${Object.keys(allMetadata).length} total)`);
      console.log(`  Complete field listing:\n`);
      
      const sortedKeys = Object.keys(allMetadata).sort();
      let count = 1;
      for (const key of sortedKeys) {
        const value = allMetadata[key];
        console.log(`     ${count}. ${key.padEnd(35)} - ${value}`);
        count++;
      }
    }
  } else {
    console.log(`\n⚠️  Note: Could not read GGUF metadata`);
  }

  if (modelConfig && modelConfig.parameters) {
    console.log(`\n🚀 LLAMASERVER RECOMMENDED PARAMETERS`);
    console.log(`  Inference settings:`);
    const params = modelConfig.parameters;
    console.log(`    Temperature:     ${params.temperature}`);
    console.log(`    Top P:           ${params.top_p}`);
    console.log(`    Top K:           ${params.top_k}`);
    console.log(`    Repeat Penalty:  ${params.repeat_penalty}`);
    console.log(`    Context Size:    ${params.ctx_size}`);
    console.log(`    Max Tokens:      ${params.n_predict}`);
    console.log(`    CPU Threads:     ${params.n_threads}`);
    console.log(`    GPU Layers:      ${params.n_gpu_layers}`);
    if (params.flash_attn) {
      console.log(`    Flash Attention: ${params.flash_attn}`);
    }
  }

  console.log('\n' + '='.repeat(80));
}

/**
 * Main entry point
 */
async function main() {
  try {
    const filePath = process.argv[2];
    let modelPath;
    let modelConfig;

    if (filePath) {
      // Direct file path provided
      if (!fs.existsSync(filePath)) {
        console.error(`Error: File not found: ${filePath}`);
        process.exit(1);
      }
      modelPath = filePath;
    } else {
      // Interactive mode: load from launchConfig.json
      const models = loadModels();
      
      if (models.length === 0) {
        console.error('Error: No models found in launchConfig.json');
        process.exit(1);
      }

      modelConfig = await selectModel(models);
      modelPath = modelConfig.path;
    }

    // Read GGUF metadata using official library
    const data = await readGGUFMetadata(modelPath);

    // Check for Jinja2 template
    const jinja2Template = data && data.metadata ? checkJinja2Template(data.metadata) : null;

    displayResults(data, modelPath, modelConfig, jinja2Template);
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
