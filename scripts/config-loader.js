import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse as parseJsonc } from 'jsonc-parser';

/**
 * Configuration Loader Utility
 * Ensures consistent path resolution regardless of where scripts are executed from
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get the root project directory (parent of scripts folder)
 */
export function getRootDir() {
    return path.dirname(__dirname);
}

/**
 * Get the scripts directory
 */
export function getScriptsDir() {
    return __dirname;
}

/**
 * Get the reports directory
 */
export function getReportsDir() {
    const reportsDir = path.join(getRootDir(), 'reports');
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }
    return reportsDir;
}

/**
 * Load launchConfig.json with JSONC support
 */
export function loadLaunchConfig() {
    try {
        const configPath = path.join(getScriptsDir(), 'launchConfig.json');
        if (!fs.existsSync(configPath)) {
            throw new Error(`launchConfig.json not found at ${configPath}`);
        }
        const data = fs.readFileSync(configPath, 'utf8');
        const parsed = parseJsonc(data);
        if (parsed === undefined) {
            throw new Error('Failed to parse launchConfig.json');
        }
        return parsed;
    } catch (err) {
        console.error(`❌ Error loading launchConfig.json:`, err.message);
        throw err;
    }
}

/**
 * Load promptConfig.json with JSONC support
 */
export function loadPromptConfig() {
    try {
        const configPath = path.join(getScriptsDir(), 'promptConfig.json');
        if (!fs.existsSync(configPath)) {
            throw new Error(`promptConfig.json not found at ${configPath}`);
        }
        const data = fs.readFileSync(configPath, 'utf8');
        const parsed = parseJsonc(data);
        if (parsed === undefined) {
            throw new Error('Failed to parse promptConfig.json');
        }
        return parsed;
    } catch (err) {
        console.error(`❌ Error loading promptConfig.json:`, err.message);
        throw err;
    }
}

/**
 * Load both configs
 */
export function loadAllConfigs() {
    return {
        launch: loadLaunchConfig(),
        prompt: loadPromptConfig()
    };
}

/**
 * Log directory info for debugging
 */
export function logDirectoryInfo() {
    console.log('\n📁 Directory Configuration:');
    console.log(`   Root:    ${getRootDir()}`);
    console.log(`   Scripts: ${getScriptsDir()}`);
    console.log(`   Reports: ${getReportsDir()}`);
    console.log('');
}

export default {
    getRootDir,
    getScriptsDir,
    getReportsDir,
    loadLaunchConfig,
    loadPromptConfig,
    loadAllConfigs,
    logDirectoryInfo
};
