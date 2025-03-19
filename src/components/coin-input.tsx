"use client"

import { forwardRef } from "react"
import { cn } from "../utils/utils"
import Image from "next/image"
import { NumericFormat } from "react-number-format"

// Define the props interface for CoinInput
interface CoinInputProps {
  coin: string;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  showIcon?: boolean;
  form?: any;
  error?: string;
  value?: string | number;
  onChange?: (e: any) => void;
  name?: string;
  disabled?: boolean;
  autoComplete?: string;
  id?: string;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  onKeyUp?: React.KeyboardEventHandler<HTMLInputElement>;
  [key: string]: any; // Allow any additional props
}

export const CoinInput = forwardRef<HTMLInputElement, CoinInputProps>(
  ({ coin, className, showIcon = true, form, error, onChange, value, name, ...rest }, ref) => {
    // Handle value changes from NumericFormat
    const handleValueChange = (values: any) => {
      if (onChange) {
        // Create a synthetic event object that mimics a standard input change event
        const syntheticEvent = {
          target: {
            name: name,
            value: values.value
          }
        };
        onChange(syntheticEvent);
      }
    };

    return (
      <div className="flex flex-col gap-2">
        <div
          className={cn(
            "flex w-full items-center gap-3 rounded-full border border-gray-300 bg-gary-input-blue/40 px-4 py-3 shadow-sm sm:gap-4 sm:px-6"
          )}
        >
          <NumericFormat
            getInputRef={ref}
            valueIsNumericString={true}
            decimalScale={5}
            fixedDecimalScale
            decimalSeparator="."
            thousandSeparator={false}
            allowNegative={false}
            placeholder={rest.placeholder || "0.00000"}
            value={value}
            onValueChange={handleValueChange}
            className={cn(
              "flex-grow appearance-none bg-transparent text-base font-medium text-gray-800 placeholder-gray-400 outline-none sm:text-lg",
              className
            )}
            name={name}
            id={rest.id}
            disabled={rest.disabled}
            readOnly={rest.readOnly}
            autoComplete={rest.autoComplete}
            onBlur={rest.onBlur}
            onFocus={rest.onFocus}
            onKeyDown={rest.onKeyDown}
            onKeyUp={rest.onKeyUp}
            type="text"
          />
          {showIcon && (
            <div className="flex items-center gap-2">
              <Image src={`/icons/coins/${coin?.toLowerCase()}.png`} alt={coin} width={42} height={42} />
            </div>
          )}
        </div>
        {error && <span className="text-sm text-red-500">{error}</span>}
      </div>
    )
  }
);

CoinInput.displayName = "CoinInput";