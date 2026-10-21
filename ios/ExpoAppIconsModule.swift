import ExpoModulesCore

public class ExpoAppIconsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoAppIcons")

    Function("isSupported") { () -> Bool in
      !AppIcons.alternates.isEmpty
    }

    Function("getAlternateIcons") { () -> [String] in
      AppIcons.alternates
    }

    AsyncFunction("getIcon") { () async -> String in
      await AppIcons.current()
    }

    AsyncFunction("setIcon") { (name: String) async throws -> String in
      try await AppIcons.set(name)
    }
  }
}
