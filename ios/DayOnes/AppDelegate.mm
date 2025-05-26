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
  
  // Request permission for notifications
  if ([UNUserNotificationCenter class]) {
    UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
    center.delegate = self;
    [center requestAuthorizationWithOptions:(UNAuthorizationOptionSound | UNAuthorizationOptionAlert | UNAuthorizationOptionBadge)
                          completionHandler:^(BOOL granted, NSError * _Nullable error) {
      if (granted) {
        dispatch_async(dispatch_get_main_queue(), ^{
          [[UIApplication sharedApplication] registerForRemoteNotifications];
        });
      }
      NSLog(@"Notification permission granted: %@", granted ? @"YES" : @"NO");
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
  NSLog(@"Successfully registered for remote notifications with token: %@", deviceToken);
  [FIRMessaging messaging].APNSToken = deviceToken;
}

// Handle failed registration for remote notifications
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error {
  NSLog(@"Failed to register for remote notifications: %@", error);
}

// Handle receiving a remote notification when app is in foreground
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo
fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler {
  NSLog(@"Received remote notification: %@", userInfo);
  completionHandler(UIBackgroundFetchResultNewData);
}

#pragma mark - UNUserNotificationCenterDelegate

// Handle notification when app is in foreground
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
       willPresentNotification:(UNNotification *)notification
         withCompletionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler {
  NSDictionary *userInfo = notification.request.content.userInfo;
  NSLog(@"Received foreground notification: %@", userInfo);
  
  // Show the notification even when app is in foreground
  completionHandler(UNNotificationPresentationOptionBanner | UNNotificationPresentationOptionSound);
}

// Handle user tapping on notification
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
didReceiveNotificationResponse:(UNNotificationResponse *)response
         withCompletionHandler:(void (^)(void))completionHandler {
  NSDictionary *userInfo = response.notification.request.content.userInfo;
  NSLog(@"User tapped notification: %@", userInfo);
  completionHandler();
}

@end
