import React, { useState } from 'react';
interface ServingsSelectorProps {
  onBack?: () => void;
  onContinue?: (value: string) => void;
  className?: string;
  style?: React.CSSProperties;
}
export const ServingsSelector: React.FC<ServingsSelectorProps> = ({
  onBack,
  onContinue,
  className = '',
  style = {}
}) => {
  const [selectedOption, setSelectedOption] = useState<string>('15-30 minutes ');
  const options = ['15-30 minutes ', '30-45 minutes', '45-60 minutes', 'More than 60 minutes'];
  const handleContinue = () => {
    if (onContinue) {
      onContinue(selectedOption);
    }
  };
  return <div className={`select-servings ${className}`.trim()} style={{
    width: '100%',
    maxWidth: '1440px',
    minHeight: '1024px',
    display: 'flex',
    flexDirection: 'column',
    paddingLeft: '16px',
    paddingRight: '521px',
    paddingTop: '54px',
    paddingBottom: '137px',
    gap: '63px',
    backgroundColor: 'rgba(242, 248, 245, 1)',
    boxSizing: 'border-box',
    borderRadius: '20px',
    overflow: 'hidden',
    position: 'relative',
    margin: '0 auto',
    ...style
  }}>
      <button onClick={onBack} style={{
      background: 'none',
      border: 'none',
      padding: 0,
      cursor: 'pointer',
      width: '24px',
      height: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10
    }} aria-label="Go back">
        <img src="https://storage.googleapis.com/storage.magicpath.ai/user/392816559460073472/figma-assets/e514b213-7127-45ee-bc04-5b0c571f36e4.svg" alt="Arrow" style={{
        width: '24px',
        height: '24px',
        boxSizing: 'border-box'
      }} />
      </button>

      <div className="progress-container" style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'row',
      gap: '6px',
      boxSizing: 'border-box',
      flexShrink: 0,
      zIndex: 1,
      position: 'relative'
    }}>
        <div style={{
        height: '12px',
        backgroundColor: 'rgba(51, 153, 91, 1)',
        boxSizing: 'border-box',
        borderRadius: '30px',
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: '0'
      }} />
        <div style={{
        height: '12px',
        backgroundColor: 'rgba(31, 143, 99, 1)',
        boxSizing: 'border-box',
        borderRadius: '30px',
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: '0'
      }} />
        <div style={{
        height: '12px',
        backgroundColor: 'rgba(31, 143, 99, 1)',
        boxSizing: 'border-box',
        borderRadius: '30px',
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: '0'
      }} />
        <div style={{
        height: '12px',
        backgroundColor: 'rgba(31, 143, 99, 1)',
        boxSizing: 'border-box',
        borderRadius: '30px',
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: '0'
      }} />
      </div>

      <div className="content-wrapper" style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '32px',
      boxSizing: 'border-box',
      flexShrink: 0,
      zIndex: 2,
      position: 'relative'
    }}>
        <h1 style={{
        margin: 0,
        color: 'rgba(26, 26, 26, 1)',
        fontSize: '32px',
        fontFamily: '"Poppins", sans-serif',
        fontWeight: 700,
        lineHeight: '38.4px',
        letterSpacing: '-1.6px',
        textAlign: 'left',
        alignSelf: 'stretch'
      }}>
          How much time do you usually spend cooking?
        </h1>

        <div className="options-list" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxSizing: 'border-box',
        alignSelf: 'stretch'
      }}>
          {options.map(option => {
          const isSelected = selectedOption === option;
          return <button key={option} onClick={() => setSelectedOption(option)} style={{
            height: 'auto',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            padding: '16px 24px',
            gap: '12px',
            backgroundColor: isSelected ? 'rgba(255, 228, 194, 1)' : 'rgba(255, 255, 255, 1)',
            borderColor: isSelected ? 'rgba(174, 220, 144, 1)' : 'rgba(204, 204, 204, 1)',
            borderStyle: 'solid',
            borderWidth: '1px',
            boxSizing: 'border-box',
            borderRadius: '16px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            textAlign: 'left',
            width: '100%'
          }} onMouseEnter={e => {
            if (!isSelected) {
              e.currentTarget.style.backgroundColor = 'rgba(250, 250, 250, 1)';
            }
          }} onMouseLeave={e => {
            if (!isSelected) {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
            }
          }}>
                <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '4px'
            }}>
                  <span style={{
                color: 'rgba(26, 26, 26, 1)',
                fontSize: '20px',
                fontFamily: '"Poppins", sans-serif',
                fontWeight: 700,
                lineHeight: '24px',
                letterSpacing: '0px'
              }}>
                    {option}
                  </span>
                </div>
              </button>;
        })}
        </div>
      </div>

      <button className="continue-button" onClick={handleContinue} style={{
      width: '425px',
      height: '61px',
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '16px 24px',
      gap: '12px',
      backgroundColor: 'rgba(31, 143, 99, 1)',
      border: 'none',
      boxSizing: 'border-box',
      borderRadius: '16px',
      cursor: 'pointer',
      position: 'absolute',
      left: '507px',
      top: '915px',
      zIndex: 3,
      transition: 'background-color 0.2s ease, transform 0.1s active'
    }} onMouseEnter={e => {
      e.currentTarget.style.backgroundColor = 'rgba(25, 115, 80, 1)';
    }} onMouseLeave={e => {
      e.currentTarget.style.backgroundColor = 'rgba(31, 143, 99, 1)';
    }} onMouseDown={e => {
      e.currentTarget.style.transform = 'scale(0.98)';
    }} onMouseUp={e => {
      e.currentTarget.style.transform = 'scale(1)';
    }}>
        <span style={{
        color: 'rgba(250, 250, 250, 1)',
        fontSize: '18px',
        fontFamily: '"Poppins", sans-serif',
        fontWeight: 700,
        lineHeight: '25.2px',
        letterSpacing: '0px'
      }}>
          Continue
        </span>
      </button>

      <style>
        {`
          @media (max-width: 1440px) {
            .select-servings {
              padding-right: 16px !important;
            }
            .continue-button {
              left: 50% !important;
              transform: translateX(-50%) !important;
            }
          }
          @media (max-width: 480px) {
            .continue-button {
              width: calc(100% - 32px) !important;
            }
          }
        `}
      </style>
    </div>;
};