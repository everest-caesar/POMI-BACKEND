interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    from?: string;
}
interface MessageNotificationOptions {
    recipientEmail: string;
    recipientName: string;
    senderName: string;
    messageSnippet: string;
    conversationUrl?: string;
    listingTitle?: string | null;
    listingPrice?: number | null;
    listingLocation?: string | null;
}
declare const _default: {
    sendEmail: (options: SendEmailOptions) => Promise<boolean>;
    sendMessageNotification: (options: MessageNotificationOptions) => Promise<boolean>;
    sendWelcomeEmail: (email: string, username: string) => Promise<boolean>;
    sendEventCreationNotification: (eventTitle: string, eventDate: string, organizerName: string, organizerEmail: string) => Promise<boolean>;
    sendBusinessSubmissionNotification: (businessName: string, category: string, ownerName: string, ownerEmail: string) => Promise<boolean>;
    sendListingSubmissionNotification: (listingTitle: string, listingPrice: number, sellerName: string, sellerEmail: string) => Promise<boolean>;
    sendVerificationCodeEmail: (email: string, code: string, type?: "signup" | "login" | "password_reset") => Promise<boolean>;
};
export default _default;
//# sourceMappingURL=emailService.d.ts.map