import { globalIgnores } from "eslint/config";
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';

export default [
  // 基础规则推荐
  js.configs.recommended,
  // TypeScript 推荐规则
  ...tseslint.configs.recommended,
  // Import 插件相关配置
  {
    plugins: {
      import: importPlugin,
    },
    settings: {
      'import/extensions': ['.js', '.jsx', '.ts', '.tsx'],
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
        typescript: {
          project: './tsconfig.json',
        },
        alias: {
          map: [['@', './src']],
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
      },
      sourceType: 'module',
      ecmaVersion: 'latest',
    },
    rules: {
      eqeqeq: ['error', 'always'],
      // 这里可以添加你自己定义的规则，如需迁移之前的自定义规则，可加在此处
    },
    files: ['src/*.{ts,tsx,js,jsx}'],
  },
  globalIgnores(['src/bindings.ts'])
];