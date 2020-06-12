const sonarqubeScanner = require('sonarqube-scanner');

function sonar(callback) {
    sonarqubeScanner(
        {
            options: {
                'sonar.sources': 'src',
                'sonar.tests': 'test',
                'sonar.projectKey': 'flowscripter_cli-framework',
                'sonar.projectVersion': `travis_build_${process.env.TRAVIS_BUILD_NUMBER}`,
                'sonar.links.homepage': 'https://www.npmjs.com/package/@flowscripter/cli-framework',
                'sonar.links.ci': 'https://travis-ci.com/flowscripter/cli-framework',
                'sonar.links.scm': 'https://github.com/flowscripter/cli-framework',
                'sonar.links.issue': 'https://github.com/flowscripter/cli-framework/issues',
                'sonar.typescript.lcov.reportPaths': 'reports/lcov.info',
                'sonar.eslint.reportPaths': 'reports/eslint.json'
            }
        },
        callback
    );
}

exports.sonar = sonar;
