import React, { useState } from 'react';
import { useAuth, SignupData } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Car, User, Building2 } from 'lucide-react';
import { toast } from 'sonner';
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: 'signin' | 'signup';
}
export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'signin'
}) => {
  const {
    login,
    signup,
    resetPassword
  } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode);
  const [role, setRole] = useState<'customer' | 'owner'>('customer');
  const [loading, setLoading] = useState(false);

  // Sign In Form
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up Form - Common
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Customer specific
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState<'car' | 'bike'>('car');

  // Owner specific
  const [businessName, setBusinessName] = useState('');
  const [gst, setGst] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [governmentId, setGovernmentId] = useState('');

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState('');
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await login(signInEmail, signInPassword);
    setLoading(false);
    if (success) {
      onSuccess();
    }
  };
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      alert('Please accept the terms and conditions');
      return;
    }
    if (role === 'owner' && !governmentId) {
      toast.error('Government ID is required for owners');
      return;
    }
    setLoading(true);
    const data: SignupData = {
      email,
      phone,
      password,
      role,
      name,
      address
    };
    if (role === 'customer' && vehicleNumber) {
      data.vehicles = [{
        type: vehicleType,
        number: vehicleNumber
      }];
    }
    if (role === 'owner') {
      data.businessName = businessName;
      data.gst = gst;
      data.bankDetails = bankDetails;
      data.governmentId = governmentId;
    }
    const success = await signup(data);
    setLoading(false);
    if (success) {
      onSuccess();
    }
  };
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await resetPassword(forgotEmail);
    setLoading(false);
    if (success) {
      setMode('signin');
      setForgotEmail('');
    }
  };
  const resetForm = () => {
    setSignInEmail('');
    setSignInPassword('');
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setAddress('');
    setVehicleNumber('');
    setVehicleType('car');
    setBusinessName('');
    setGst('');
    setBankDetails('');
    setGovernmentId('');
    setAcceptedTerms(false);
    setForgotEmail('');
  };
  const handleClose = () => {
    resetForm();
    onClose();
  };
  return <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          
          <DialogDescription>Sign in or create an account to continue</DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={v => setMode(v as 'signin' | 'signup')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 mb-4">
                <Button type="button" variant="outline" size="sm" onClick={() => {
                setSignInEmail('customer@test.com');
                setSignInPassword('password123');
              }} className="text-xs">
                  <User className="w-3 h-3 mr-1" />
                  Demo Customer
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => {
                setSignInEmail('owner@test.com');
                setSignInPassword('password123');
              }} className="text-xs">
                  <Building2 className="w-3 h-3 mr-1" />
                  Demo Owner
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input id="signin-email" type="email" value={signInEmail} onChange={e => setSignInEmail(e.target.value)} required placeholder="your@email.com" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input id="signin-password" type="password" value={signInPassword} onChange={e => setSignInPassword(e.target.value)} required placeholder="••••••••" />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
              
              <Button type="button" variant="link" className="w-full text-sm" onClick={() => setMode('forgot')}>
                Forgot Password?
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="forgot">
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email</Label>
                <Input id="forgot-email" type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required placeholder="your@email.com" />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
              
              <Button type="button" variant="link" className="w-full text-sm" onClick={() => setMode('signin')}>
                Back to Sign In
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant={role === 'customer' ? 'default' : 'outline'} onClick={() => setRole('customer')} className="w-full">
                  <User className="w-4 h-4 mr-2" />
                  Customer
                </Button>
                <Button type="button" variant={role === 'owner' ? 'default' : 'outline'} onClick={() => setRole('owner')} className="w-full">
                  <Building2 className="w-4 h-4 mr-2" />
                  Owner
                </Button>
              </div>

              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} required placeholder="John Doe" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="your@email.com" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+1234567890" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input id="address" value={address} onChange={e => setAddress(e.target.value)} required placeholder="123 Main St, City" />
                </div>

                {role === 'customer' && <>
                    <div className="space-y-2">
                      <Label>Vehicle Type</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button type="button" variant={vehicleType === 'car' ? 'default' : 'outline'} onClick={() => setVehicleType('car')}>
                          🚗 Car
                        </Button>
                        <Button type="button" variant={vehicleType === 'bike' ? 'default' : 'outline'} onClick={() => setVehicleType('bike')}>
                          🏍️ Bike
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vehicle-number">Vehicle Number (Optional)</Label>
                      <Input id="vehicle-number" value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} placeholder="NY-1234" />
                    </div>
                  </>}

                {role === 'owner' && <>
                    <div className="space-y-2">
                      <Label htmlFor="business-name">Business Name</Label>
                      <Input id="business-name" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Your Parking Business" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="government-id">Government ID *</Label>
                      <Input id="government-id" value={governmentId} onChange={e => setGovernmentId(e.target.value)} required placeholder="Aadhar/Passport/Driving License" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gst">GST Number (Optional)</Label>
                      <Input id="gst" value={gst} onChange={e => setGst(e.target.value)} placeholder="GST123456789" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bank-details">Bank/UPI Details</Label>
                      <Input id="bank-details" value={bankDetails} onChange={e => setBankDetails(e.target.value)} placeholder="UPI: example@upi or Bank Account" />
                    </div>
                  </>}

                <div className="flex items-center space-x-2">
                  <Checkbox id="terms" checked={acceptedTerms} onCheckedChange={checked => setAcceptedTerms(checked as boolean)} />
                  <label htmlFor="terms" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    I accept the terms and conditions
                  </label>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>;
};