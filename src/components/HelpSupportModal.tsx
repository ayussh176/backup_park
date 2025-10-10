import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send } from 'lucide-react';
import { toast } from 'sonner';

interface HelpSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpSupportModal: React.FC<HelpSupportModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock submission
    toast.success('Your message has been sent! We\'ll get back to you soon.');
    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Help & Support</DialogTitle>
          <DialogDescription>
            Find answers to common questions or contact us for assistance
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="faq">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="contact">Contact Us</TabsTrigger>
          </TabsList>

          <TabsContent value="faq" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>How do I book a parking slot?</AccordionTrigger>
                <AccordionContent>
                  To book a parking slot:
                  <ol className="list-decimal ml-4 mt-2 space-y-1">
                    <li>Search for parking spaces using the search bar or map</li>
                    <li>Select a parking space and click "Book Now"</li>
                    <li>Choose your vehicle type (car or bike)</li>
                    <li>Select an available slot</li>
                    <li>Enter booking details (vehicle number, date, time, duration)</li>
                    <li>Complete payment</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>Can I cancel my booking?</AccordionTrigger>
                <AccordionContent>
                  Yes, you can cancel your booking from your dashboard. Go to "My Bookings" and click 
                  the cancel button next to your booking. Please note that cancellation policies may vary 
                  by parking space.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>What payment methods are accepted?</AccordionTrigger>
                <AccordionContent>
                  We accept multiple payment methods including:
                  <ul className="list-disc ml-4 mt-2 space-y-1">
                    <li>UPI</li>
                    <li>QR Code payments</li>
                    <li>Net Banking</li>
                    <li>Credit/Debit Cards</li>
                    <li>Cash on Pay</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger>How do I list my parking space?</AccordionTrigger>
                <AccordionContent>
                  To list your parking space:
                  <ol className="list-decimal ml-4 mt-2 space-y-1">
                    <li>Sign up as an Owner</li>
                    <li>Click "List Space" in the header</li>
                    <li>Fill in your parking space details (location, pricing, slots)</li>
                    <li>Upload photos of your parking space</li>
                    <li>Submit for review</li>
                  </ol>
                  Once approved, your parking space will be visible to customers.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger>What if I can't find my vehicle type?</AccordionTrigger>
                <AccordionContent>
                  Currently, we support cars and bikes. If a parking space doesn't have slots for your 
                  vehicle type, you'll see a message indicating no slots are available. Try searching for 
                  other nearby parking spaces that support your vehicle type.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger>How does the slot release work?</AccordionTrigger>
                <AccordionContent>
                  When your booking time ends, the slot automatically becomes available for other users. 
                  You'll receive a notification when your booking is about to expire. If you need to extend 
                  your stay, please make a new booking or contact the parking space owner.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7">
                <AccordionTrigger>What are the different parking categories?</AccordionTrigger>
                <AccordionContent>
                  We have three parking categories:
                  <ul className="list-disc ml-4 mt-2 space-y-1">
                    <li><strong>Commercial:</strong> Paid parking spaces with professional management</li>
                    <li><strong>Free:</strong> Public parking spaces with no charges</li>
                    <li><strong>Private:</strong> Personal spaces (e.g., in front of homes) shared for parking</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="contact">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact-name">Name</Label>
                <Input
                  id="contact-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-email">Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-message">Message</Label>
                <Textarea
                  id="contact-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  placeholder="How can we help you?"
                  rows={5}
                />
              </div>

              <Button type="submit" className="w-full">
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </Button>

              <div className="text-sm text-muted-foreground text-center">
                <p>Or reach us at:</p>
                <p className="font-medium">support@parkeasy.com</p>
                <p className="font-medium">+1 (555) 123-4567</p>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
