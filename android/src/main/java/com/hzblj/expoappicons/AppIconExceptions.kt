package com.hzblj.expoappicons

import expo.modules.kotlin.exception.CodedException

internal class UnknownAppIconException(name: String) : CodedException("'$name' is not an app icon this build ships")
