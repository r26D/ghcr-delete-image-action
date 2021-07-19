/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 979:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const utils = __nccwpck_require__(349);
const core = __nccwpck_require__(105);

async function deleteByTag(config, octokit) {
  core.info(`🔎 search package version with tag ${config.tag}...`);

  const packageVersion = await utils.findPackageVersionByTag(
    octokit,
    config.owner,
    config.name,
    config.tag
  );

  core.info(`🆔 package id is #${packageVersion.id}, delete it...`);

  await utils.deletePackageVersion(
    octokit,
    config.owner,
    config.name,
    packageVersion.id
  );

  core.info(`✅ package #${packageVersion.id} deleted.`);
}

async function deleteUntaggedOrderGreaterThan(config, octokit) {
  core.info(`🔎 find not latest ${config.untaggedKeepLatest} packages...`);

  const pkgs = await utils.findPackageVersionsUntaggedOrderGreaterThan(
    octokit,
    config.owner,
    config.name,
    config.untaggedKeepLatest
  );

  core.startGroup(`🗑 delete ${pkgs.length} packages`);

  for (const pkg of pkgs) {
    await utils.deletePackageVersion(
      octokit,
      config.owner,
      config.name,
      pkg.id
    );

    core.info(`✅ package #${pkg.id} deleted.`);
  }

  core.endGroup();
}

async function deleteTagRegexMatchOrderGreaterThan(config, octokit) {
  core.info(`🔎 finding latest ${config.taggedKeepLatest} packages matching regex ${config.tagRegex}...`);

  const pkgs = await utils.findPackageVersionsTagRegexMatchOrderGreaterThan(
    octokit,
    config.owner,
    config.name,
    config.taggedKeepLatest,
    new RegExp(config.tagRegex)
  );

  core.startGroup(`🗑 delete ${pkgs.length} packages`);

  for (const pkg of pkgs) {
    await utils.deletePackageVersion(
      octokit,
      config.owner,
      config.name,
      pkg.id
    );

    core.info(`✅ package #${pkg.id} deleted.`);
  }

  core.endGroup();
}

module.exports = { deleteByTag, deleteUntaggedOrderGreaterThan, deleteTagRegexMatchOrderGreaterThan };


/***/ }),

/***/ 349:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const core = __nccwpck_require__(105);

/**
 * Parse input from env.
 * @returns Config
 */
let getConfig = function () {
  const config = {
    owner: core.getInput("owner", { required: true }),
    name: core.getInput("name", { required: true }),
    token: core.getInput("token", { required: true }),

    // optional, mutual exclusive options
    tag: core.getInput("tag") || null,
    untaggedKeepLatest: core.getInput("untagged-keep-latest") || null,
    untaggedOlderThan: core.getInput("untagged-older-than") || null,
    taggedKeepLatest: core.getInput("tagged-keep-latest") || null,
    tagRegex: core.getInput("tag-regex") || null,
  };

  const definedOptionsCount = [
    config.tag,
    config.untaggedKeepLatest,
    config.untaggedOlderThan,
    config.taggedKeepLatest,
    config.tagRegex
  ].filter((x) => x !== null).length;

  if (definedOptionsCount == 0) {
    throw new Error("no any required options defined");
  }
  // else if (definedOptionsCount > 1) {
  //   throw new Error("too many selectors defined, use only one");
  // }

  if (config.untaggedKeepLatest) {
    if (
      isNaN((config.untaggedKeepLatest = parseInt(config.untaggedKeepLatest)))
    ) {
      throw new Error("untagged-keep-latest is not number");
    }
  }

  if (config.taggedKeepLatest) {
    if (
      isNaN((config.taggedKeepLatest = parseInt(config.taggedKeepLatest)))
    ) {
      throw new Error("tagged-keep-latest is not number");
    }
    if (!config.tagRegex)
      throw new Error("regex must be provided when tagged-keep-latest set");
  }

  if (config.untaggedOlderThan) {
    if (
      isNaN((config.untaggedOlderThan = parseInt(config.untaggedOlderThan)))
    ) {
      throw new Error("untagged-older-than is not number");
    }
  }

  return config;
};

let findPackageVersionByTag = async function (octokit, owner, name, tag) {
  const tags = new Set();

  for await (const pkgVer of iteratePackageVersions(octokit, owner, name)) {
    const versionTags = pkgVer.metadata.container.tags;

    if (versionTags.includes(tag)) {
      return pkgVer;
    } else {
      versionTags.map((item) => {
        tags.add(item);
      });
    }
  }

  throw new Error(
    `package with tag '${tag}' does not exits, available tags: ${Array.from(
      tags
    ).join(", ")}`
  );
};

let findPackageVersionsUntaggedOrderGreaterThan = async function (
  octokit,
  owner,
  name,
  n
) {
  const pkgs = [];

  for await (const pkgVer of iteratePackageVersions(octokit, owner, name)) {
    const versionTags = pkgVer.metadata.container.tags;
    if (versionTags.length == 0) {
      pkgs.push(pkgVer);
    }
  }

  pkgs.sort((a, b) => {
    return new Date(b.updated_at) - new Date(a.updated_at);
  });

  return pkgs.slice(n);
};

let findPackageVersionsTagRegexMatchOrderGreaterThan = async function (
  octokit,
  owner,
  name,
  n,
  regex
) {
  const pkgs = [];
  // const pkgVers = await iteratePackageVersions(octokit, owner, name);
  for await (const pkgVer of iteratePackageVersions(octokit, owner, name)) {
    core.info(`🔎 found pkgVer ${pkgVer.metadata.container.tags}...`);
    const versionTags = pkgVer.metadata.container.tags;
    if (regex && versionTags.length > 0) {
      for (let tag of versionTags) {
        core.info(`🔎 found tag ${tag}...`);

        if (!regex.test(tag)) {
          core.info(`🔎 tag ${tag} does not match. Ignoring`);
        
          continue;
        }
        core.info(`🔎 tag ${tag} matches. Deleting...`);
        pkgs.push(pkgVer);
        break;
      }
    }
  }

  pkgs.sort((a, b) => {
    return new Date(b.updated_at) - new Date(a.updated_at);
  });

  return pkgs.slice(n);
};

let iteratePackageVersions = async function* (octokit, owner, name) {
  for await (const response of octokit.paginate.iterator(
    octokit.rest.packages.getAllPackageVersionsForPackageOwnedByOrg,
    {
      package_type: "container",
      package_name: name,
      org: owner,
      state: "active",
      per_page: 100,
    }
  )) {
    for (let packageVersion of response.data) {
      core.info('found package!');
      yield packageVersion;
    }
  }
};

let deletePackageVersion = async (octokit, owner, name, versionId) => {
  await octokit.rest.packages.deletePackageVersionForOrg({
    package_type: "container",
    package_name: name,
    org: owner,
    package_version_id: versionId,
  });
};

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

module.exports = {
  getConfig,
  findPackageVersionByTag,
  deletePackageVersion,
  findPackageVersionsUntaggedOrderGreaterThan,
  findPackageVersionsTagRegexMatchOrderGreaterThan,
  sleep,
};


/***/ }),

/***/ 105:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 82:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
const core = __nccwpck_require__(105);
const github = __nccwpck_require__(82);
const utils = __nccwpck_require__(349);
const actions = __nccwpck_require__(979);

async function run() {
  try {
    const config = utils.getConfig();
    const octokit = github.getOctokit(config.token, {
      log: {
        debug: () => core.info,
        info: () => core.info,
        warn: core.info,
        error: core.error
      },
    });

    if (config.tag) {
      await actions.deleteByTag(config, octokit);
    } else if (config.untaggedKeepLatest) {
      await actions.deleteUntaggedOrderGreaterThan(config, octokit);
    } else if (config.taggedKeepLatest && config.tagRegex) {
      await actions.deleteTagRegexMatchOrderGreaterThan(config, octokit);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();

})();

module.exports = __webpack_exports__;
/******/ })()
;