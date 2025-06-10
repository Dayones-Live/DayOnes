import UserNotifications
import OneSignalExtension

class NotificationService: UNNotificationServiceExtension {
    var contentHandler: ((UNNotificationContent) -> Void)?
    var receivedRequest: UNNotificationRequest!
    var bestAttemptContent: UNMutableNotificationContent?

    // Note this extension only runs when `mutable_content` is set
    // Setting an attachment or action buttons automatically sets the property to true
    override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
        self.receivedRequest = request
        self.contentHandler = contentHandler
        self.bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)

        if let bestAttemptContent = bestAttemptContent {
            // Get the notification data
            if let userInfo = request.content.userInfo as? [String: Any] {
                // Check for custom title and body in the notification data
                if let customTitle = userInfo["title"] as? String {
                    bestAttemptContent.title = customTitle
                }
                if let customBody = userInfo["body"] as? String {
                    bestAttemptContent.body = customBody
                }
                
                // Log the notification data for debugging
                print("Notification data:", userInfo)
            }

            // DEBUGGING: Uncomment the 2 lines below to check this extension is executing
//            print("Running NotificationServiceExtension")
//            bestAttemptContent.body = "[Modified] " + bestAttemptContent.body

            // Process the notification with OneSignal
            OneSignalExtension.didReceiveNotificationExtensionRequest(self.receivedRequest, with: bestAttemptContent, withContentHandler: self.contentHandler)
        }
    }

    override func serviceExtensionTimeWillExpire() {
        // Called just before the extension will be terminated by the system.
        if let contentHandler = contentHandler, let bestAttemptContent = bestAttemptContent {
            contentHandler(bestAttemptContent)
        }
    }
}
