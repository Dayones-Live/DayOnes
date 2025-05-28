#import "AppDelegate.h"
#import <React/RCTBundleURLProvider.h>
#import <Firebase.h>
#import <GoogleSignIn/GoogleSignIn.h>
#import <AuthenticationServices/AuthenticationServices.h>
#import <UserNotifications/UserNotifications.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [FIRApp configure];
  
  // Log launch options for push notification
  if (launchOptions[UIApplicationLaunchOptionsRemoteNotificationKey]) {
    NSLog(@"📱 [Push] App launched from push notification: %@", launchOptions[UIApplicationLaunchOptionsRemoteNotificationKey]);
  }
  
  // Request permission for notifications
  if ([UNUserNotificationCenter class]) {
    NSLog(@"📱 [Push] Setting up notification center...");
    UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
    center.delegate = self;
    
    // Check current notification settings
    [center getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings *settings) {
      NSLog(@"📱 [Push] Current notification settings:");
      NSLog(@"📱 [Push] - Authorization status: %ld", (long)settings.authorizationStatus);
      NSLog(@"📱 [Push] - Sound enabled: %d", settings.soundSetting == UNNotificationSettingEnabled);
      NSLog(@"📱 [Push] - Badge enabled: %d", settings.badgeSetting == UNNotificationSettingEnabled);
      NSLog(@"📱 [Push] - Alert enabled: %d", settings.alertSetting == UNNotificationSettingEnabled);
    }];
    
    [center requestAuthorizationWithOptions:(UNAuthorizationOptionSound | UNAuthorizationOptionAlert | UNAuthorizationOptionBadge)
                          completionHandler:^(BOOL granted, NSError * _Nullable error) {
      if (error) {
        NSLog(@"❌ [Push] Error requesting notification permission: %@", error);
      }
      
      if (granted) {
        NSLog(@"✅ [Push] Notification permission granted");
        dispatch_async(dispatch_get_main_queue(), ^{
          [[UIApplication sharedApplication] registerForRemoteNotifications];
          NSLog(@"📱 [Push] Registered for remote notifications");
        });
      } else {
        NSLog(@"❌ [Push] Notification permission denied");
      }
    }];
  }
  
  NSLog(@"[GoogleSignIn] App Launch - Bundle ID: %@", [[NSBundle mainBundle] bundleIdentifier]);
  NSLog(@"[GoogleSignIn] App Launch - URL Types: %@", [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleURLTypes"]);
  
  // Configure Apple Sign-in
  if (@available(iOS 13.0, *)) {
    ASAuthorizationAppleIDProvider *provider = [[ASAuthorizationAppleIDProvider alloc] init];
    [provider getCredentialStateForUserID:[[NSUserDefaults standardUserDefaults] stringForKey:@"userIdentifier"] completion:^(ASAuthorizationAppleIDProviderCredentialState credentialState, NSError * _Nullable error) {
      switch (credentialState) {
        case ASAuthorizationAppleIDProviderCredentialAuthorized:
          NSLog(@"Apple ID Credential is valid");
          break;
        case ASAuthorizationAppleIDProviderCredentialRevoked:
          NSLog(@"Apple ID Credential revoked");
          break;
        case ASAuthorizationAppleIDProviderCredentialNotFound:
          NSLog(@"Apple ID Credential not found");
          break;
        default:
          break;
      }
    }];
  }
  
  self.moduleName = @"DayOnes";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

// Handle Google Sign-In callback URL
- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  NSLog(@"[GoogleSignIn] Received URL: %@", url);
  NSLog(@"[GoogleSignIn] URL scheme: %@", url.scheme);
  NSLog(@"[GoogleSignIn] URL host: %@", url.host);
  NSLog(@"[GoogleSignIn] URL path: %@", url.path);
  NSLog(@"[GoogleSignIn] URL query: %@", url.query);
  
  BOOL handled = [[GIDSignIn sharedInstance] handleURL:url];
  NSLog(@"[GoogleSignIn] URL handled: %d", handled);
  return handled;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

#pragma mark - Push Notification Methods

// Handle successful registration for remote notifications
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
  NSString *tokenString = [self stringFromDeviceToken:deviceToken];
  NSLog(@"✅ [Push] Successfully registered for remote notifications");
  NSLog(@"📱 [Push] Device Token: %@", tokenString);
  [FIRMessaging messaging].APNSToken = deviceToken;
  NSLog(@"📱 [Push] APNS token set in Firebase Messaging");
}

// Helper method to convert device token to string
- (NSString *)stringFromDeviceToken:(NSData *)deviceToken {
  NSUInteger length = deviceToken.length;
  const unsigned char *data = (const unsigned char *)deviceToken.bytes;
  NSMutableString *token = [NSMutableString stringWithCapacity:length * 2];
  
  for (NSUInteger i = 0; i < length; i++) {
    [token appendFormat:@"%02.2hhX", data[i]];
  }
  
  return [token copy];
}

// Handle failed registration for remote notifications
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error {
  NSLog(@"❌ [Push] Failed to register for remote notifications");
  NSLog(@"❌ [Push] Error: %@", error);
  NSLog(@"❌ [Push] Error description: %@", error.localizedDescription);
  NSLog(@"❌ [Push] Error domain: %@", error.domain);
  NSLog(@"❌ [Push] Error code: %ld", (long)error.code);
}

// Handle receiving a remote notification when app is in foreground
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo
fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler {
  NSLog(@"📱 [Push] Received remote notification in background");
  NSLog(@"📱 [Push] Notification payload: %@", userInfo);
  
  // Log specific notification details
  if (userInfo[@"aps"]) {
    NSDictionary *aps = userInfo[@"aps"];
    NSLog(@"📱 [Push] Alert: %@", aps[@"alert"]);
    NSLog(@"📱 [Push] Badge: %@", aps[@"badge"]);
    NSLog(@"📱 [Push] Sound: %@", aps[@"sound"]);
  }
  
  completionHandler(UIBackgroundFetchResultNewData);
}

#pragma mark - UNUserNotificationCenterDelegate

// Handle notification when app is in foreground
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
       willPresentNotification:(UNNotification *)notification
         withCompletionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler {
  NSDictionary *userInfo = notification.request.content.userInfo;
  NSLog(@"📱 [Push] Received foreground notification");
  NSLog(@"📱 [Push] Notification content: %@", notification.request.content);
  NSLog(@"📱 [Push] Notification payload: %@", userInfo);
  
  // Log specific notification details
  if (userInfo[@"aps"]) {
    NSDictionary *aps = userInfo[@"aps"];
    NSLog(@"📱 [Push] Alert: %@", aps[@"alert"]);
    NSLog(@"📱 [Push] Badge: %@", aps[@"badge"]);
    NSLog(@"📱 [Push] Sound: %@", aps[@"sound"]);
  }
  
  // Show the notification even when app is in foreground
  completionHandler(UNNotificationPresentationOptionBanner | UNNotificationPresentationOptionSound);
}

// Handle user tapping on notification
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
didReceiveNotificationResponse:(UNNotificationResponse *)response
         withCompletionHandler:(void (^)(void))completionHandler {
  NSDictionary *userInfo = response.notification.request.content.userInfo;
  NSLog(@"📱 [Push] User tapped notification");
  NSLog(@"📱 [Push] Action identifier: %@", response.actionIdentifier);
  NSLog(@"📱 [Push] Notification payload: %@", userInfo);
  
  // Log specific notification details
  if (userInfo[@"aps"]) {
    NSDictionary *aps = userInfo[@"aps"];
    NSLog(@"📱 [Push] Alert: %@", aps[@"alert"]);
    NSLog(@"📱 [Push] Badge: %@", aps[@"badge"]);
    NSLog(@"📱 [Push] Sound: %@", aps[@"sound"]);
  }
  
  completionHandler();
}

@end
