import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    '.source/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Plain Node CLI tooling, not app source — CommonJS require() is
    // intentional here (package.json has no "type": "module"), not a
    // lint violation.
    'scripts/**',
  ]),
])

export default eslintConfig