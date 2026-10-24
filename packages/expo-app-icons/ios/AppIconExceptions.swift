import ExpoModulesCore

internal final class AlternateIconsUnsupportedException: Exception {
  override var reason: String {
    "This device cannot change the app icon"
  }
}

internal final class UnknownAppIconException: GenericException<String> {
  override var reason: String {
    "'\(param)' is not an app icon this build ships"
  }
}

internal final class AppIconChangeFailedException: GenericException<String> {
  override var reason: String {
    "The app icon could not be changed: \(param)"
  }
}
