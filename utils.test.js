const utils = require("./utils");
const github = require("@actions/github");

let withEnv = (envs, cb) => {
  for (const k in envs) {
    process.env[k] = envs[k];
  }

  cb();

  for (const k in envs) {
    delete process.env[k];
  }
};

describe("getConfig", () => {
  test("throw error if value is missing", () => {
    expect(() => {
      utils.getConfig();
    }).toThrow();
  });

  const sharedRequiredOpts = {
    INPUT_OWNER: "machship",
    INPUT_NAME: "ghcr-delete-image-action",
    INPUT_TOKEN: "some-token",
  };

  test("returns valid config", () => {
    withEnv(
      {
        ...sharedRequiredOpts,
        INPUT_TAG: "latest",
      },
      () => {
        expect(utils.getConfig()).toStrictEqual({
          owner: "machship",
          name: "ghcr-delete-image-action",
          token: "some-token",
          tag: "latest",
          untaggedKeepLatest: null,
          untaggedOlderThan: null,
        });
      }
    );
  });

  test("throw error if no any required defined", () => {
    withEnv(
      {
        ...sharedRequiredOpts,
      },
      () => {
        expect(() => utils.getConfig()).toThrow(
          "no any required options defined"
        );
      }
    );
  });

  test("throw error if more then on selector defined", () => {
    withEnv(
      {
        ...sharedRequiredOpts,
        "INPUT_UNTAGGED-KEEP-LATEST": "2",
        "INPUT_UNTAGGED-OLDER-THAN": "3",
      },
      () => {
        expect(() => utils.getConfig()).toThrow(
          "too many selectors defined, use only one"
        );
      }
    );
  });

  test("throw error if untagged keep latest is not number", () => {
    withEnv(
      {
        ...sharedRequiredOpts,
        "INPUT_UNTAGGED-KEEP-LATEST": "asdf",
      },
      () => {
        expect(() => utils.getConfig()).toThrow(
          "untagged-keep-latest is not number"
        );
      }
    );
  });

  test("throw error if untagged older than is not number", () => {
    withEnv(
      {
        ...sharedRequiredOpts,
        "INPUT_UNTAGGED-OLDER-THAN": "asdf",
      },
      () => {
        expect(() => utils.getConfig()).toThrow(
          "untagged-older-than is not number"
        );
      }
    );
  });
});

