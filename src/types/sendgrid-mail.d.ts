declare module '@sendgrid/mail' {
  interface MailService {
    setApiKey(apiKey: string): void;
    send(data: any): Promise<any>;
  }

  const mail: MailService;
  export default mail;
}
