#!/usr/bin/env node

import { execSync } from "child_process";
import { writeFileSync, readFileSync } from "fs";
import inquirer from "inquirer";

const yarnInstallIn = (packagePath: string) => {
  process.chdir(packagePath);
  execSync("yarn", {
    stdio: [0, 1, 2],
  });
};

export const getRepoUrl = (name: string) => {
  return `https://github.com/timthedev07/${name}`;
};

const updatePackageJson = (projectName: string) => {
  const filePath = `${projectName}/package.json`;
  const packageJson = JSON.parse(readFileSync(filePath).toString());
  packageJson.name = projectName;
  writeFileSync(filePath, JSON.stringify(packageJson, null, 2));
  yarnInstallIn(projectName);
};

const BOILERPLATES = {
  "Next.js with TailwindCSS": "next-tailwind-ts-boilerplate",
  "Express + Next.js URQL GraphQL Session Auth":
    "nextjs-express-urql-session-auth",
  "Next.js with NextAuth.js, Tailwindcss, and Prisma": "next-auth-prisma-pgql",
};

// scripts used to modify stuff like `name` in package.json
const MODIFICATION_SCRIPTS: Record<
  keyof typeof BOILERPLATES,
  (projectName: string) => Promise<void> | void
> = {
  "Express + Next.js URQL GraphQL Session Auth": async (projectName) => {
    const apiFilePath = `${projectName}/api/package.json`;
    const ormConfigPath = `${projectName}/api/ormconfig.ts`;
    const webFilePath = `${projectName}/web/package.json`;

    const { dbName } = await inquirer.prompt<{ dbName: string }>([
      {
        name: "dbName",
        message: "Database name:",
        validate: (a) => {
          if (!a) return "Please enter a valid database name";
          return true;
        },
      },
    ]);

    const apiPackageJson = JSON.parse(readFileSync(apiFilePath).toString());
    apiPackageJson.name = projectName + "-api";
    const webPackageJson = JSON.parse(readFileSync(webFilePath).toString());
    webPackageJson.name = projectName + "-web";

    const ormConfig = readFileSync(ormConfigPath).toString();

    writeFileSync(apiFilePath, JSON.stringify(apiPackageJson, null, 2));
    writeFileSync(webFilePath, JSON.stringify(webPackageJson, null, 2));
    writeFileSync(
      ormConfigPath,
      ormConfig.replace('database: "example-db"', `database: "${dbName}"`)
    );
    yarnInstallIn(projectName + "/api");
    yarnInstallIn("../web");
  },
  "Next.js with TailwindCSS": updatePackageJson,
  "Next.js with NextAuth.js, Tailwindcss, and Prisma": updatePackageJson,
};

(async () => {
  const { boilerplate, projectName } = await inquirer.prompt<{
    boilerplate: keyof typeof BOILERPLATES;
    projectName: string;
  }>([
    {
      name: "boilerplate",
      message: "Choose boilerplate:",
      type: "list",
      choices: Object.keys(BOILERPLATES),
    },
    {
      name: "projectName",
      message: "Name of your project(package name):",
      validate: (a) => {
        if (!a) return "Please enter a valid project name";
        return true;
      },
    },
  ]);
  const gitUrl = getRepoUrl(BOILERPLATES[boilerplate]);
  process.chdir(process.cwd());
  execSync(`git clone ${gitUrl}`);
  execSync(`mv ${BOILERPLATES[boilerplate]} ${projectName}`);
  execSync(`trash ${projectName}/README.md ${projectName}/.git`);
  execSync(`git init ${projectName}`);

  // execute modification script
  await MODIFICATION_SCRIPTS[boilerplate](projectName);
})();
