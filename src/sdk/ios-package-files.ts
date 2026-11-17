import packageSwift from "../../ios/NorthlineKit/Package.swift?raw";
import models from "../../ios/NorthlineKit/Sources/NorthlineKit/Models.swift?raw";
import transport from "../../ios/NorthlineKit/Sources/NorthlineKit/Transport.swift?raw";
import client from "../../ios/NorthlineKit/Sources/NorthlineKit/Northline.swift?raw";
import messenger from "../../ios/NorthlineKit/Sources/NorthlineKit/MessengerView.swift?raw";
import tests from "../../ios/NorthlineKit/Tests/NorthlineKitTests/NorthlineTests.swift?raw";

export const IOS_PACKAGE_FILES = [
  { id: "package", name: "Package.swift", source: packageSwift },
  { id: "client", name: "Northline.swift", source: client },
  { id: "messenger", name: "MessengerView.swift", source: messenger },
  { id: "transport", name: "Transport.swift", source: transport },
  { id: "models", name: "Models.swift", source: models },
  { id: "tests", name: "NorthlineTests.swift", source: tests },
] as const;
