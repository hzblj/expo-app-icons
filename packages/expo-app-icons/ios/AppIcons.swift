import UIKit

private let defaultIconName = "default"
private let alternateIconPrefix = "AppIcon-"

internal enum AppIcons {
  static let alternates: [String] = {
    let icons = Bundle.main.object(forInfoDictionaryKey: "CFBundleIcons") as? [String: Any]
    let alternateIcons = icons?["CFBundleAlternateIcons"] as? [String: Any] ?? [:]

    return alternateIcons.keys
      .filter { $0.hasPrefix(alternateIconPrefix) }
      .map { String($0.dropFirst(alternateIconPrefix.count)) }
      .sorted()
  }()

  @MainActor
  static func current() -> String {
    name(of: UIApplication.shared.alternateIconName)
  }

  @MainActor
  static func set(_ name: String) async throws -> String {
    let alternateIconName = try alternateIconName(for: name)
    let application = UIApplication.shared

    guard application.supportsAlternateIcons else {
      throw AlternateIconsUnsupportedException()
    }

    if application.applicationState != .active {
      await waitUntilActive()
    }

    if application.alternateIconName == alternateIconName {
      return "unchanged"
    }

    do {
      try await application.setAlternateIconName(alternateIconName)
    } catch {
      throw AppIconChangeFailedException(error.localizedDescription)
    }

    return "changed"
  }

  private static func alternateIconName(for name: String) throws -> String? {
    if name == defaultIconName {
      return nil
    }

    guard alternates.contains(name) else {
      throw UnknownAppIconException(name)
    }

    return alternateIconPrefix + name
  }

  private static func name(of alternateIconName: String?) -> String {
    guard let alternateIconName, alternateIconName.hasPrefix(alternateIconPrefix) else {
      return defaultIconName
    }

    return String(alternateIconName.dropFirst(alternateIconPrefix.count))
  }

  @MainActor
  private static func waitUntilActive() async {
    for await _ in NotificationCenter.default.notifications(named: UIApplication.didBecomeActiveNotification) {
      return
    }
  }
}
