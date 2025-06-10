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
            if let customData = request.content.userInfo["custom"] as? [String: Any] {
                // Log the notification data for debugging
                print("📱 Notification data:", customData)
                
                // Set custom title and body if available
                if let title = customData["title"] as? String {
                    bestAttemptContent.title = title
                }
                
                if let body = customData["body"] as? String {
                    bestAttemptContent.body = body
                }
                
                // Set category identifier for custom actions
                if let type = customData["type"] as? String {
                    bestAttemptContent.categoryIdentifier = type
                }
            }
            
            // Process the notification with OneSignal
            OneSignalExtension.didReceiveNotificationExtensionRequest(
                self.receivedRequest,
                with: self.bestAttemptContent,
                withContentHandler: self.contentHandler
            )
        }
    }

    override func serviceExtensionTimeWillExpire() {
        // Called just before the extension will be terminated by the system.
        // Use this as an opportunity to deliver your "best attempt" at modified content, otherwise the original push payload will be used.
        if let contentHandler = contentHandler, let bestAttemptContent = bestAttemptContent {
            OneSignalExtension.serviceExtensionTimeWillExpireRequest(
                self.receivedRequest,
                with: self.bestAttemptContent
            )
            contentHandler(bestAttemptContent)
        }
    }
}
