interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    from?: string;
}
declare const _default: {
    sendEmail: (options: SendEmailOptions) => Promise<boolean>;
    sendWelcomeEmail: (email: string, username: string) => Promise<boolean>;
    sendEventCreationNotification: (eventTitle: string, eventDate: string, organizerName: string, organizerEmail: string) => Promise<boolean>;
    sendBusinessSubmissionNotification: (businessName: string, category: string, ownerName: string, ownerEmail: string) => Promise<boolean>;
    sendListingSubmissionNotification: (listingTitle: string, listingPrice: number, sellerName: string, sellerEmail: string) => Promise<boolean>;
};
export default _default;
//# sourceMappingURL=emailService.d.ts.map