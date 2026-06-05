#!/bin/bash

# Default to Android build if no parameter provided
PARAM=${1:-a}

# Build based on parameter (prebuild is optional)
case "$PARAM" in
  a|android)
    echo "🔨 Building Android..."
    pnpm android
    ;;
  ap|android-prebuild)
    echo "🔨 Running prebuild and building Android..."
    npx expo prebuild && pnpm android
    ;;

  pc|prebuild-clean)
    echo "🔨 Running prebuild and cleaning Android..."
    npx expo prebuild --clean 
    ;; 

  i|ios)
    echo "🔨 Building iOS..."
    pnpm ios
    ;;
  ip|ios-prebuild)
    echo "🔨 Running prebuild and building iOS..."
    npx expo prebuild && pnpm ios
    ;;
  s|stop)
    echo "🛑 Stopping Gradle daemon..."
    cd android && ./gradlew --stop && cd ..
    ;;
  c|clean)
    echo "🧹 Cleaning Android build..."
    # Remove native/build dirs first so CMake doesn't reference missing codegen JNI paths during clean.
    # Exclude native clean tasks that fail when codegen JNI dirs don't exist (e.g. after fresh clone).
    rm -rf android/app/.cxx android/app/build android/build
    cd android && ./gradlew clean \
      -x externalNativeBuildCleanDebug \
      -x externalNativeBuildCleanRelease \
      && cd ..
    ;;
  r|release)
    echo "📦 Building Android release APK..."
    cd android && ./gradlew assembleRelease && cd ..
    ;;
  b|bundle)
    echo "🔨 Running prebuild..."
    npx expo prebuild 
    echo "📦 Building Android release bundle..."
    cd android && ./gradlew bundleRelease && cd ..
    ;;
  p|prebuild)
    echo "🔨 Running prebuild"
    npx expo prebuild 
    ;; 
  *)
    echo "Usage: ./build.sh [a|ap|i|ip|s|c|r|b|p|pc]"
    echo "  a, android        - Build Android (no prebuild)"
    echo "  ap, android-prebuild - Prebuild + Build Android"
    echo "  i, ios            - Build iOS (no prebuild)"
    echo "  ip, ios-prebuild  - Prebuild + Build iOS"
    echo "  p, prebuild       - Prebuild"
    echo "  pc, prebuild-clean - Prebuild and clean"
    echo "  s, stop           - Stop Gradle daemon"
    echo "  c, clean          - Clean Android build"
    echo "  r, release        - Build release APK"
    echo "  b, bundle         - Build release bundle"
    exit 1
    ;;
esac

