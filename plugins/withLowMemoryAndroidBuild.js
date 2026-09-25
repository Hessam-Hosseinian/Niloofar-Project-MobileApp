const fs = require("fs");
const os = require("os");
const path = require("path");
const { AndroidConfig, withGradleProperties } = require("expo/config-plugins");

const BUILD_PROPERTIES = {
  "org.gradle.daemon": "false",
  "org.gradle.parallel": "false",
  "org.gradle.workers.max": "1",
  "org.gradle.jvmargs": "-Xmx1536m -XX:MaxMetaspaceSize=384m -Dfile.encoding=UTF-8",
  "kotlin.compiler.execution.strategy": "in-process",
};

module.exports = function withLowMemoryAndroidBuild(config) {
  return withGradleProperties(config, (gradleConfig) => {
    for (const [name, value] of Object.entries(BUILD_PROPERTIES)) {
      AndroidConfig.BuildProperties.updateAndroidBuildProperty(
        gradleConfig.modResults,
        name,
        value
      );
    }

    // Use the local Java 17 installation when present; other machines keep their own JDK setup.
    const localJava17 = path.join(
      os.homedir(),
      ".local/share/mise/installs/java/17.0.2"
    );
    if (fs.existsSync(path.join(localJava17, "bin", "jlink"))) {
      AndroidConfig.BuildProperties.updateAndroidBuildProperty(
        gradleConfig.modResults,
        "org.gradle.java.home",
        localJava17
      );
    }

    return gradleConfig;
  });
};
