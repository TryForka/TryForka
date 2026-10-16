import React, { useState } from 'react';
interface DietSelectorProps {
  className?: string;
  style?: React.CSSProperties;
  onSelect?: (diets: string[]) => void;
  onContinue?: (diets: string[]) => void;
  onBack?: () => void;
}

/**
 * DietSelector
 * A production-ready version of the Select Diet screen.
 * Maintains 100% visual fidelity to the Figma design while adding interactivity and responsiveness.
 */
export const DietSelector: React.FC<DietSelectorProps> = ({
  className = '',
  style = {},
  onSelect,
  onContinue,
  onBack
}) => {
  // Initialize with the diets selected in the Figma design
  const [selectedDiets, setSelectedDiets] = useState<string[]>(['Classic', 'Pescetarian']);
  const diets = ['Classic', 'Low Carb', 'Keto', 'Flexitarian', 'Paleo', 'Vegetarian', 'Pescetarian', 'Vegan'];
  const toggleDiet = (diet: string) => {
    const newSelection = selectedDiets.includes(diet) ? selectedDiets.filter(d => d !== diet) : [...selectedDiets, diet];
    setSelectedDiets(newSelection);
    if (onSelect) onSelect(newSelection);
  };
  const handleContinue = () => {
    if (onContinue) onContinue(selectedDiets);
  };
  const handleBack = () => {
    if (onBack) onBack();
  };
  return <div className={`select-diet ${className}`.trim()} style={{
    width: '100%',
    maxWidth: '1440px',
    minHeight: '1024px',
    display: 'flex',
    flexDirection: 'column',
    paddingLeft: '16px',
    paddingRight: '16px',
    paddingTop: '54px',
    paddingBottom: '137px',
    gap: '39px',
    backgroundColor: 'rgba(242, 248, 245, 1)',
    boxSizing: 'border-box',
    borderRadius: '20px',
    overflow: 'hidden',
    position: 'relative',
    margin: '0 auto',
    ...style
  }}>
      {/* Back Button */}
      <button onClick={handleBack} aria-label="Go back" style={{
      width: '24px',
      height: '24px',
      padding: 0,
      border: 'none',
      background: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
      transition: 'opacity 0.2s ease'
    }} onMouseEnter={e => e.currentTarget.style.opacity = '0.7'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
        <img src="https://storage.googleapis.com/storage.magicpath.ai/user/392816559460073472/figma-assets/ce255be1-9a44-4186-96c6-92eb4db7bd92.svg" alt="Arrow" style={{
        width: '24px',
        height: '24px',
        boxSizing: 'border-box'
      }} />
      </button>

      {/* Progress Bar */}
      <nav className="frame-38" aria-label="Progress" style={{
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
        <div style={{
        height: '12px',
        backgroundColor: 'rgba(230, 230, 230, 1)',
        borderRadius: '30px',
        flex: 1
      }} />
      </nav>

      {/* Content Area */}
      <main className="frame-40" style={{
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
        textAlign: 'left'
      }}>
          Pick your diet
        </h1>

        <div className="frame-2" role="group" aria-label="Diet options" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxSizing: 'border-box',
        width: '100%'
      }}>
          {diets.map(diet => {
          const isSelected = selectedDiets.includes(diet);
          return <button key={diet} onClick={() => toggleDiet(diet)} style={{
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
            overflow: 'hidden',
            cursor: 'pointer',
            width: '100%',
            transition: 'all 0.2s ease',
            outline: 'none'
          }} onMouseEnter={e => {
            if (!isSelected) e.currentTarget.style.borderColor = 'rgba(174, 220, 144, 1)';
          }} onMouseLeave={e => {
            if (!isSelected) e.currentTarget.style.borderColor = 'rgba(204, 204, 204, 1)';
          }}>
                <span style={{
              color: 'rgba(26, 26, 26, 1)',
              fontSize: '18px',
              fontFamily: '"Poppins", sans-serif',
              fontWeight: 700,
              lineHeight: '25.2px',
              letterSpacing: '0px',
              textAlign: 'left'
            }}>
                  {diet}
                </span>
              </button>;
        })}
        </div>
      </main>

      {/* Continue Button */}
      <div style={{
      position: 'absolute',
      left: '0',
      right: '0',
      top: '915px',
      display: 'flex',
      justifyContent: 'center',
      width: '100%',
      pointerEvents: 'none'
    }}>
        <button className="button" onClick={handleContinue} style={{
        width: '425px',
        maxWidth: 'calc(100% - 32px)',
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
        overflow: 'hidden',
        cursor: 'pointer',
        zIndex: 3,
        pointerEvents: 'auto',
        transition: 'background-color 0.2s ease, transform 0.1s active'
      }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(25, 115, 80, 1)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(31, 143, 99, 1)'} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
          <span style={{
          color: 'rgba(250, 250, 250, 1)',
          fontSize: '18px',
          fontFamily: '"Poppins", sans-serif',
          fontWeight: 700,
          lineHeight: '25.2px',
          letterSpacing: '0px',
          textAlign: 'left'
        }}>
            Continue
          </span>
        </button>
      </div>
    </div>;
};