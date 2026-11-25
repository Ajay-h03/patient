import { IsString, IsUUID, MinLength } from 'class-validator';

export class VerifyPaymentDto {
  @IsUUID()
  paymentId: string;

  @IsString()
  @MinLength(3)
  razorpay_order_id: string;

  @IsString()
  @MinLength(3)
  razorpay_payment_id: string;

  @IsString()
  @MinLength(3)
  razorpay_signature: string;
}
