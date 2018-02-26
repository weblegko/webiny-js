#!/usr/bin/env node
import compose from "webiny-compose";
import logger from "./utils/logger";
import getRepository from "./utils/getRepository";
import verifyEnvironment from "./plugins/verifyEnvironment";
import getLernaPackages from "./utils/getLernaPackages";
import getSinglePackage from "./utils/getSinglePackage";

import analyzeCommits from "./plugins/analyzeCommits";
import githubVerify from "./plugins/github/verify";
import githubPublish from "./plugins/github/publish";
import npmVerify from "./plugins/npm/verify";
import npmPublish from "./plugins/npm/publish";
import releaseNotes from "./plugins/releaseNotes";
import updatePackageJson from "./plugins/updatePackageJson";

export {
    analyzeCommits,
    githubVerify,
    githubPublish,
    npmVerify,
    npmPublish,
    releaseNotes,
    updatePackageJson,
    getLernaPackages,
    getSinglePackage
};

export default async config => {
    const params = {
        packages: Array.isArray(config.packages) ? config.packages : [config.packages],
        logger: logger(),
        config: {
            ci: config.ci || true,
            preview: config.preview || false,
            repositoryUrl: config.repositoryUrl || (await getRepository()),
            branch: config.branch || "master",
            tagFormat:
                typeof config.tagFormat === "function"
                    ? config.tagFormat
                    : pkg => pkg.name + "@v${version}"
        }
    };

    if (!config.plugins) {
        let { preset } = config;

        if (!preset || preset === "default") {
            preset = "./presets/default";
        }

        const presetExports = await import(preset);

        if (presetExports.plugins) {
            config.plugins = await presetExports.plugins();
        }

        if (presetExports.packages) {
            config.plugins = await presetExports.packages();
        }
    }

    // Verify packages data structure
    params.packages.map(pkg => {
        if (
            !pkg.hasOwnProperty("name") ||
            !pkg.hasOwnProperty("packageJSON") ||
            !pkg.hasOwnProperty("location")
        ) {
            throw new Error(
                `Packages MUST contain \`name\`, \`location\` and \`packageJSON\` keys.`
            );
        }
    });

    return compose([verifyEnvironment(), ...config.plugins])(params);
};