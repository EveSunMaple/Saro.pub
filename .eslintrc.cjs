// .eslintrc.cjs
module.exports = {
  // 指定解析器
  parser: '@typescript-eslint/parser',
  // 指定解析器选项
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true, // 启用 JSX
    },
  },
  // 定义环境变量
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  // 扩展配置
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:astro/recommended',
    'prettier', // 确保这个是最后一个，以覆盖其他配置中的格式化规则
  ],
  // 插件
  plugins: ['@typescript-eslint', 'react'],
  // 规则
  rules: {
    // 在这里自定义你的规则，例如：
    'react/react-in-jsx-scope': 'off', // 在 Astro+React项目中，通常不需要在每个文件里都 import React
    'react/prop-types': 'off', // 如果你使用TS，可以关闭propTypes校验
    '@typescript-eslint/no-explicit-any': 'warn', // 不建议使用any，但降级为警告
  },
  settings: {
    react: {
      version: 'detect', // 自动检测 React 版本
    },
  },
  // 针对特定文件类型的覆盖配置
  overrides: [
    {
      files: ['*.astro'],
      // 使用 astro-eslint-parser
      parser: 'astro-eslint-parser',
      // 解析器选项
      parserOptions: {
        parser: '@typescript-eslint/parser',
      },
    },
  ],
};