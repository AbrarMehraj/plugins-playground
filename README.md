# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

# Plugins Playground

A development workspace for building, testing, and validating Expo native modules before publishing them as standalone npm packages.

## Goal

This repository serves as a playground for experimenting with Expo Modules and native Android/iOS functionality.

Modules are first developed and tested locally inside this workspace. Once a module is stable and production-ready, it can be extracted into its own repository and published to npm.

## Current Modules

### Permission Kit

A permission management library for Expo and React Native applications.

Vision:

```ts
await PermissionKit.notifications();

await PermissionKit.batteryOptimization();

await PermissionKit.ensure([
  'notifications',
  'batteryOptimization',
  'exactAlarm',
]);
```

The library should handle:

* Permission checks
* Permission requests
* Settings navigation
* App resume detection
* Status re-checking
* Error handling
* Android and iOS platform differences

The goal is to provide a complete permission workflow with minimal integration effort.

## Development Workflow

1. Create and test modules locally.
2. Validate native Android and iOS behavior.
3. Improve API design.
4. Add automated configuration through Expo Config Plugins.
5. Extract mature modules into standalone repositories.
6. Publish to npm.

## Planned Modules

* permission-kit
* alarm-manager
* device-utils

## Repository Structure

```text
plugins-playground/
├── app/
├── modules/
│   ├── permission-kit/

│   └── future-modules/
└── README.md
```

## Philosophy

Developer experience comes first.

A developer should not need to understand platform-specific implementation details to use a module.

The ideal API should require only one or two lines of code while handling all underlying native complexity.
"""
