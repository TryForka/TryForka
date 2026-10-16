import React, { useState, useCallback } from 'react';
interface AllergySelectorProps {
  className?: string;
  style?: React.CSSProperties;
  onContinue?: (selected: string[], custom: string) => void;
  onBack?: () => void;
}
export const AllergySelector: React.FC<AllergySelectorProps> = ({
  className,
  style,
  onContinue,
  onBack
}) => {
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(['Gluten', 'Mustard']);
  const [customAllergy, setCustomAllergy] = useState<string>('');
  const allergies = ['Gluten', 'Peanut', 'Tree Nut', 'Soy', 'Sesame', 'Mustard', 'Shellfish'];
  const toggleAllergy = useCallback((allergy: string) => {
    setSelectedAllergies(prev => prev.includes(allergy) ? prev.filter(a => a !== allergy) : [...prev, allergy]);
  }, []);
  const handleContinue = () => {
    if (onContinue) {
      onContinue(selectedAllergies, customAllergy);
    }
  };
  return <div className={`select-allergies ${className || ''}`.trim()} style={{
    width: '100%',
    maxWidth: '1440px',
    minHeight: '1024px',
    display: 'flex',
    flexDirection: 'column',
    paddingLeft: '16px',
    paddingRight: '16px',
    paddingTop: '54px',
    paddingBottom: '137px',
    backgroundColor: 'rgba(242, 248, 245, 1)',
    boxSizing: 'border-box',
    borderRadius: '20px',
    overflow: 'hidden',
    position: 'relative',
    margin: '0 auto',
    fontFamily: '"Poppins", sans-serif',
    ...style
  }}>
      <button onClick={onBack} style={{
      width: '24px',
      height: '24px',
      padding: 0,
      border: 'none',
      background: 'none',
      cursor: 'pointer',
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'opacity 0.2s'
    }} onMouseEnter={e => e.currentTarget.style.opacity = '0.7'} onMouseLeave={e => e.currentTarget.style.opacity = '1'} aria-label="Go back">
        <img src="https://storage.googleapis.com/storage.magicpath.ai/user/392816559460073472/figma-assets/46aa2536-bb12-46a5-b0e0-dc1c71140e04.svg" alt="Arrow" style={{
        width: '24px',
        height: '24px'
      }} />
      </button>

      <div className="frame-40" style={{
      width: 'calc(100% - 38px)',
      height: '12px',
      display: 'flex',
      flexDirection: 'row',
      gap: '6px',
      boxSizing: 'border-box',
      position: 'absolute',
      left: '19px',
      top: '117px',
      zIndex: 1
    }}>
        <div style={{
        height: '12px',
        backgroundColor: 'rgba(51, 153, 91, 1)',
        borderRadius: '30px',
        flex: 1
      }} />
        <div style={{
        height: '12px',
        backgroundColor: 'rgba(31, 143, 99, 1)',
        borderRadius: '30px',
        flex: 1
      }} />
        <div style={{
        height: '12px',
        backgroundColor: 'rgba(230, 230, 230, 1)',
        borderRadius: '30px',
        flex: 1
      }} />
        <div style={{
        height: '12px',
        backgroundColor: 'rgba(230, 230, 230, 1)',
        borderRadius: '30px',
        flex: 1
      }} />
      </div>

      <div className="frame-39" style={{
      width: 'calc(100% - 32px)',
      display: 'flex',
      flexDirection: 'column',
      gap: '32px',
      boxSizing: 'border-box',
      position: 'absolute',
      left: '19px',
      top: '168px',
      zIndex: 2
    }}>
        <span style={{
        color: 'rgba(26, 26, 26, 1)',
        fontSize: '32px',
        fontWeight: 700,
        lineHeight: '38.4px',
        letterSpacing: '-1.6px',
        textAlign: 'left'
      }}>
          Any allergies?
        </span>

        <div className="frame-3" style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '12px',
        flexWrap: 'wrap',
        boxSizing: 'border-box',
        alignSelf: 'stretch'
      }}>
          {allergies.map(allergy => {
          const isSelected = selectedAllergies.includes(allergy);
          return <button key={allergy} onClick={() => toggleAllergy(allergy)} style={{
            width: 'auto',
            height: 'auto',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            padding: '16px 24px',
            backgroundColor: isSelected ? 'rgba(255, 228, 194, 1)' : 'rgba(255, 255, 255, 1)',
            borderColor: isSelected ? 'rgba(174, 220, 144, 1)' : 'rgba(204, 204, 204, 1)',
            borderStyle: 'solid',
            borderWidth: '1px',
            borderRadius: '16px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            outline: 'none'
          }} onMouseEnter={e => {
            if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(245, 245, 245, 1)';
          }} onMouseLeave={e => {
            if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
          }}>
                <span style={{
              color: 'rgba(26, 26, 26, 1)',
              fontSize: '18px',
              fontWeight: 700,
              lineHeight: '25.2px'
            }}>
                  {allergy}
                </span>
              </button>;
        })}
        </div>

        <div style={{
        marginTop: '15px'
      }}>
          <span style={{
          color: 'rgba(26, 26, 26, 1)',
          fontSize: '32px',
          fontWeight: 700,
          lineHeight: '38.4px',
          letterSpacing: '-1.6px',
          textAlign: 'left',
          display: 'block',
          marginBottom: '32px'
        }}>
            Don’t see your allergy? Add it below
          </span>

          <textarea value={customAllergy} onChange={e => setCustomAllergy(e.target.value)} placeholder="Ex. “I am allergic to wheat and milk”" style={{
          width: '100%',
          height: '487px',
          padding: '16px 20px',
          backgroundColor: 'rgba(255, 255, 255, 1)',
          border: '1px solid rgba(204, 204, 204, 1)',
          borderRadius: '16px',
          fontSize: '18px',
          fontFamily: '"Poppins", sans-serif',
          fontWeight: 400,
          lineHeight: '25.2px',
          color: 'rgba(26, 26, 26, 1)',
          boxSizing: 'border-box',
          resize: 'none',
          outline: 'none'
        }} />
        </div>
      </div>

      <div style={{
      position: 'absolute',
      bottom: '52px',
      left: '0',
      right: '0',
      display: 'flex',
      justifyContent: 'center',
      width: '100%',
      pointerEvents: 'none'
    }}>
        <button onClick={handleContinue} style={{
        width: '397px',
        height: '57px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '16px 24px',
        backgroundColor: 'rgba(31, 143, 99, 1)',
        border: 'none',
        borderRadius: '16px',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        pointerEvents: 'auto'
      }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(25, 115, 80, 1)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(31, 143, 99, 1)'}>
          <span style={{
          color: 'rgba(250, 250, 250, 1)',
          fontSize: '18px',
          fontWeight: 700,
          lineHeight: '25.2px'
        }}>
            Continue
          </span>
        </button>
      </div>
    </div>;
};