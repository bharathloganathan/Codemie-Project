module.exports = {
  default: {
    require: [
      'tests/support/index.ts',
      'tests/steps/**/*.ts'
    ],
    requireModule: ['ts-node/register'],
    worldParameters: {
      tsconfig: 'tests/support/tsconfig.cucumber.json'
    },
    format: [
      'progress',
      'html:test-results/cucumber-report.html',
      'json:test-results/cucumber-report.json'
    ],
    publishQuiet: true,
    parallel: 0
  }
};
