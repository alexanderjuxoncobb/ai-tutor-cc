/**
 * API key input component with validation and security features
 */

import React, { useState } from 'react';
import { Button } from '../Button';
import type { BaseComponentProps, AIProvider } from '../../../types';
import './ApiKeyInput.css';

interface ApiKeyInputProps extends BaseComponentProps {
  value: string;
  provider: AIProvider;
  onValueChange: (value: string) => void;
  onValidate?: (isValid: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
  showValidation?: boolean;
}

const providerValidation = {
  openai: {
    prefix: 'sk-',
    minLength: 40,
    name: 'OpenAI'
  },
  gemini: {
    prefix: 'AIza',
    minLength: 35,
    name: 'Google Gemini'
  }
};

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({
  value,
  provider,
  onValueChange,
  onValidate,
  disabled = false,
  placeholder,
  label,
  showValidation = true,
  className = '',
  children
}) => {
  const [showKey, setShowKey] = useState(false);
  const [focused, setFocused] = useState(false);

  const validation = providerValidation[provider];
  const isValid = value.length === 0 || (
    value.startsWith(validation.prefix) && 
    value.length >= validation.minLength
  );

  const displayPlaceholder = placeholder || `Enter your ${validation.name} API key...`;
  const displayLabel = label || `🔑 ${validation.name} API Key`;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    onValueChange(newValue);
    
    if (onValidate) {
      const newIsValid = newValue.length === 0 || (
        newValue.startsWith(validation.prefix) && 
        newValue.length >= validation.minLength
      );
      onValidate(newIsValid);
    }
  };

  const toggleVisibility = () => {
    setShowKey(!showKey);
  };

  const clearKey = () => {
    onValueChange('');
    if (onValidate) {
      onValidate(true);
    }
  };

  const allClasses = [
    'api-key-input',
    focused && 'api-key-input--focused',
    !isValid && value.length > 0 && 'api-key-input--invalid',
    disabled && 'api-key-input--disabled',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={allClasses}>
      {label && (
        <label className="api-key-input__label">
          {displayLabel}
        </label>
      )}

      <div className="api-key-input__container">
        <input
          type={showKey ? 'text' : 'password'}
          value={value}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={displayPlaceholder}
          disabled={disabled}
          className="api-key-input__field"
        />

        <div className="api-key-input__actions">
          {value && (
            <Button
              variant="secondary"
              size="small"
              onClick={toggleVisibility}
              disabled={disabled}
              className="api-key-input__toggle"
            >
              {showKey ? '🙈' : '👁️'}
            </Button>
          )}
          
          {value && (
            <Button
              variant="secondary"
              size="small"
              onClick={clearKey}
              disabled={disabled}
              className="api-key-input__clear"
            >
              ❌
            </Button>
          )}
        </div>
      </div>

      {showValidation && value.length > 0 && (
        <div className={`api-key-input__validation ${isValid ? 'valid' : 'invalid'}`}>
          {isValid ? (
            <span className="api-key-input__success">
              ✅ Valid {validation.name} API key format
            </span>
          ) : (
            <span className="api-key-input__error">
              ❌ Invalid format. {validation.name} keys should start with "{validation.prefix}" and be at least {validation.minLength} characters
            </span>
          )}
        </div>
      )}

      {children}
    </div>
  );
};