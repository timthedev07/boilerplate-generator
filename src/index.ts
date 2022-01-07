#!/usr/bin/env node

import inquirer from "inquirer";

const BOILERPLATES = [
  "Next.js with TailwindCSS",
  "Express + Next.js URQL GraphQL Session Auth",
];

(async () => {
  const { boilerplate } = await inquirer.prompt([
    {
      name: "boilerplate",
      message: "Choose boilerplate:",
      type: "list",
      choices: BOILERPLATES,
    },
  ]);
  console.log(boilerplate);
})();
