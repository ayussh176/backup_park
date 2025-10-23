import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/contexts/BookingContext';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ParkingSpace, VehicleType, PaymentMethod } from '@/types';
import { CreditCard, Check } from 'lucide-react';
import { toast } from 'sonner';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  parking: ParkingSpace;
}

// Utility for next available quarter-hour (returns "HH:mm")
function getNextAvailableTimeString() {
  const now = new Date();
  const minutes = now.getMinutes();
  let addMinutes = ((Math.ceil(minutes / 15) * 15) - minutes);
  if (addMinutes === 0) addMinutes = 15;
  now.setMinutes(minutes + addMinutes);
  now.setSeconds(0, 0);
  return now.toTimeString().slice(0, 5);
}

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, parking }) => {
  const { user, vehicles } = useAuth();
  const { createBooking } = useBooking();

  const [step, setStep] = useState<'vehicle-type' | 'slot-selection' | 'details' | 'payment' | 'upi' | 'success'>('vehicle-type');
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [customVehicleNumber, setCustomVehicleNumber] = useState('');
  // Date-time states and helpers
  const todayDateString = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(todayDateString);
  const [time, setTime] = useState(getNextAvailableTimeString());
  const [duration, setDuration] = useState('2');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [bookingId, setBookingId] = useState<string>('');
  // UPI payment
  const [upiId, setUpiId] = useState('');
  const [txnRef, setTxnRef] = useState('');
  const [showPaymentInstructions, setShowPaymentInstructions] = useState(false);
  const [submittingTxn, setSubmittingTxn] = useState(false);
  const [txnResultMsg, setTxnResultMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep('vehicle-type');
      setSelectedVehicleType(null);
      setSelectedSlot(null);
      setSelectedVehicle('');
      setCustomVehicleNumber('');
      setUpiId('');
      setTxnRef('');
      setShowPaymentInstructions(false);
      setTxnResultMsg('');
      setSubmittingTxn(false);
      setDate(todayDateString);
      setTime(getNextAvailableTimeString());
      setBookingId('');
    }
  }, [isOpen, todayDateString]);

  // Date-time sync logic
  useEffect(() => {
    if (date === todayDateString) {
      const minTime = getNextAvailableTimeString();
      if (time < minTime) setTime(minTime);
    }
  }, [date, time, todayDateString]); // runs if date changes

  const availableSlots = selectedVehicleType
    ? parking.slots.filter(s => s.vehicleType === selectedVehicleType && s.status === 'available')
    : [];

  const handleVehicleTypeSelect = (type: VehicleType) => {
    setSelectedVehicleType(type);
    setStep('slot-selection');
  };

  const handleSlotSelect = (slotId: string) => {
    setSelectedSlot(slotId);
    setStep('details');
  };

  const calculateTotal = () => {
    const slot = parking.slots.find(s => s.id === selectedSlot);
    if (!slot) return 0;
    const hours = parseInt(duration);
    return slot.pricePerHour * hours;
  };
  // UPI deep link and QR
  const upiPayAmount = calculateTotal();
  const upiVPA = 'yash48ashwin@oksbi';
  const upiPayLink = `upi://pay?pa=${upiVPA}&pn=Parking+Payment&am=${upiPayAmount}&cu=INR`;
  const upiQrImgSrc = `http://localhost:8000/api/upi_qr_image/${upiPayAmount}/`;

  // Book slot directly helper
  const bookSlotDirectly = async () => {
    try {
      const bookingData = {
        slotId: selectedSlot,
        vehicle: customVehicleNumber || selectedVehicle,
        date,
        time,
        duration: parseInt(duration),
        userId: user?.id,
      };
      const id = await createBooking(bookingData);
      setBookingId(id || '');
      setStep('success');
    } catch (e) {
      toast.error('Booking failed, please try again.');
    }
  };

  const handleDetailsSubmit = () => {
    if (!selectedVehicle && !customVehicleNumber) {
      toast.error('Please select or enter a vehicle number');
      return;
    }
    if (calculateTotal() === 0) {
      bookSlotDirectly();
    } else {
      setStep('payment');
    }
  };

  const handleContinueUPI = () => {
    if (!upiId || !upiId.match(/.+@.+/)) {
      toast.error('Please enter a valid UPI ID');
      return;
    }
    setShowPaymentInstructions(true);
  };

  const handleConfirmUPI = async () => {
    if (!txnRef) {
      toast.error('Please enter your UPI transaction reference');
      return;
    }
    setSubmittingTxn(true);
    const paymentData = {
      payment_id: bookingId,
      upi_txn_id: txnRef,
    };
    try {
      const response = await fetch('/api/submit-upi-txn/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });
      const result = await response.json();
      if (result.success) {
        setTxnResultMsg('Transaction ID submitted! Awaiting verification.');
        setStep('success');
      } else {
        setTxnResultMsg('Submission failed. Please try again.');
      }
    } catch (error) {
      setTxnResultMsg('Server error. Please try again later.');
    }
    setSubmittingTxn(false);
  };

  const handlePayment = () => {
    if (calculateTotal() === 0) {
      bookSlotDirectly();
      return;
    }
    if (paymentMethod === 'upi') {
      setStep('upi');
      return;
    }
    // Add other payment method logic here if needed
  };

  const handleClose = () => {
    setStep('vehicle-type');
    setSelectedVehicleType(null);
    setSelectedSlot(null);
    setSelectedVehicle('');
    setCustomVehicleNumber('');
    setUpiId('');
    setTxnRef('');
    setShowPaymentInstructions(false);
    setTxnResultMsg('');
    setSubmittingTxn(false);
    setDate(todayDateString);
    setTime(getNextAvailableTimeString());
    setBookingId('');
    onClose();
  };

  // Helper to get min time string for Input[type="time"]
  const minTimeStr = date === todayDateString ? getNextAvailableTimeString() : '00:00';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book Parking Slot</DialogTitle>
          <DialogDescription>{parking.name}</DialogDescription>
        </DialogHeader>
        {step === 'vehicle-type' && (
          <div className="space-y-4">
            <h3 className="font-semibold">Select Vehicle Type</h3>
            <div className="grid grid-cols-2 gap-4">
              {parking.vehicleTypes.includes('car') && (
                <Card
                  className="cursor-pointer hover:border-primary transition-smooth"
                  onClick={() => handleVehicleTypeSelect('car')}
                >
                  <CardHeader className="text-center">
                    <div className="text-4xl mb-2">🚗</div>
                    <CardTitle>Car</CardTitle>
                    <CardDescription>
                      {parking.slots.filter(s => s.vehicleType === 'car' && s.status === 'available').length} slots available
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
              {parking.vehicleTypes.includes('bike') && (
                <Card
                  className="cursor-pointer hover:border-primary transition-smooth"
                  onClick={() => handleVehicleTypeSelect('bike')}
                >
                  <CardHeader className="text-center">
                    <div className="text-4xl mb-2">🏍️</div>
                    <CardTitle>Bike</CardTitle>
                    <CardDescription>
                      {parking.slots.filter(s => s.vehicleType === 'bike' && s.status === 'available').length} slots available
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </div>
          </div>
        )}
        {step === 'slot-selection' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                Select {selectedVehicleType === 'car' ? '🚗 Car' : '🏍️ Bike'} Slot
              </h3>
              <Button variant="outline" size="sm" onClick={() => setStep('vehicle-type')}>
                Change Type
              </Button>
            </div>
            {availableSlots.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No {selectedVehicleType} slots available</p>
                <Button className="mt-4" onClick={() => setStep('vehicle-type')}>
                  Select Different Type
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {availableSlots.map((slot) => (
                  <Card
                    key={slot.id}
                    className={`cursor-pointer hover:border-primary transition-smooth ${
                      selectedSlot === slot.id ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handleSlotSelect(slot.id)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold mb-1">{slot.slotNumber}</div>
                      <div className="text-xs text-muted-foreground">₹{slot.pricePerHour}/hr</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
        {step === 'details' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Booking Details</h3>
              <Button variant="outline" size="sm" onClick={() => setStep('slot-selection')}>
                Change Slot
              </Button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Vehicle</Label>
                {vehicles.length > 0 ? (
                  <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles
                        .filter(v => v.type === selectedVehicleType)
                        .map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.number} ({vehicle.model || vehicle.type})
                          </SelectItem>
                        ))}
                      <SelectItem value="custom">Enter custom number</SelectItem>
                    </SelectContent>
                  </Select>
                ) : null}
                {(vehicles.length === 0 || selectedVehicle === 'custom') && (
                  <Input
                    placeholder="Enter vehicle number"
                    value={customVehicleNumber}
                    onChange={(e) => setCustomVehicleNumber(e.target.value)}
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={todayDateString}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Start Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    min={minTimeStr}
                    onChange={(e) => {
                      if (date === todayDateString) {
                        const minTime = getNextAvailableTimeString();
                        if (e.target.value < minTime) {
                          toast.error(`Please pick a valid time (minimum: ${minTime})`);
                          setTime(minTime);
                        } else {
                          setTime(e.target.value);
                        }
                      } else {
                        setTime(e.target.value);
                      }
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (hours)</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger id="duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12, 24].map((h) => (
                      <SelectItem key={h} value={h.toString()}>
                        {h} {h === 1 ? 'hour' : 'hours'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleDetailsSubmit}>
                {calculateTotal() === 0 ? 'Book Slot' : 'Continue to Payment'}
              </Button>
            </div>
          </div>
        )}
        {step === 'payment' && (
          <div className="space-y-4">
            <h3 className="font-semibold">Payment & Summary</h3>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Parking:</span>
                  <span className="font-medium">{parking.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Slot:</span>
                  <span className="font-medium">
                    #{parking.slots.find(s => s.id === selectedSlot)?.slotNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vehicle:</span>
                  <span className="font-medium">
                    {customVehicleNumber || vehicles.find(v => v.id === selectedVehicle)?.number}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date & Time:</span>
                  <span className="font-medium">{date} at {time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">{duration} hours</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-primary text-lg">₹{calculateTotal()}</span>
                </div>
              </CardContent>
            </Card>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['upi'] as PaymentMethod[]).map((method) => (
                  <Button
                    key={method}
                    type="button"
                    variant={paymentMethod === method ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod(method)}
                    className="capitalize"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {method === 'upi' ? 'UPI' : method}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep('details')}>
                Back
              </Button>
              <Button className="flex-1" onClick={handlePayment}>
                Complete Booking
              </Button>
            </div>
          </div>
        )}
        {step === 'upi' && (
          <div className="space-y-4">
            {!showPaymentInstructions ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Enter your UPI ID</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Input
                      placeholder="your-upi-id@bank"
                      value={upiId}
                      onChange={e => setUpiId(e.target.value)}
                    />
                  </CardContent>
                </Card>
                <Button className="w-full mt-2" onClick={handleContinueUPI}>
                  Continue to UPI Payment
                </Button>
              </>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">UPI Payment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <strong>Amount:</strong> ₹{upiPayAmount}
                    </div>
                    <div>
                      <strong>Pay to:</strong> {upiVPA}
                    </div>
                    <div>
                      <a href={upiPayLink} target="_blank" rel="noopener" className="underline text-primary">
                        Pay Now with UPI App
                      </a>
                    </div>
                    <div className="mt-2">
                      <img src={upiQrImgSrc} alt="Scan to Pay" style={{ width: 180 }} />
                      <div>Or scan with your UPI app</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Enter Transaction Reference</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Input
                      placeholder="Transaction Reference Id"
                      value={txnRef}
                      onChange={e => setTxnRef(e.target.value)}
                    />
                  </CardContent>
                </Card>
                <Button
                  className="w-full mt-2"
                  onClick={handleConfirmUPI}
                  disabled={submittingTxn}
                >
                  {submittingTxn ? 'Submitting...' : 'Confirm Payment and Complete Booking'}
                </Button>
                {txnResultMsg && <div className="mt-2 text-green-600">{txnResultMsg}</div>}
              </>
            )}
          </div>
        )}
        {step === 'success' && (
          <div className="space-y-6 text-center py-8">
            <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-success" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Booking Confirmed!</h3>
              <p className="text-muted-foreground">
                Your parking slot has been booked successfully
              </p>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Booking ID:</span>
                  <span className="font-medium">{bookingId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Parking:</span>
                  <span className="font-medium">{parking.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Paid:</span>
                  <span className="font-bold text-success">₹{upiPayAmount}</span>
                </div>
              </CardContent>
            </Card>
            <Button className="w-full" onClick={handleClose}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
