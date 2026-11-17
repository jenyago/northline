// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "NorthlineKit",
    platforms: [
        .iOS(.v17),
    ],
    products: [
        .library(name: "NorthlineKit", targets: ["NorthlineKit"]),
    ],
    targets: [
        .target(name: "NorthlineKit"),
        .testTarget(name: "NorthlineKitTests", dependencies: ["NorthlineKit"]),
    ]
)
