#import "AppDelegate.h"
#import <React/RCTBundleURLProvider.h>
#import <Firebase.h>
#import <GoogleSignIn/GoogleSignIn.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [FIRApp configure];
  NSLog(@"[GoogleSignIn] App Launch - Bundle ID: %@", [[NSBundle mainBundle] bundleIdentifier]);
  NSLog(@"[GoogleSignIn] App Launch - URL Types: %@", [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleURLTypes"]);
  
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

@end
