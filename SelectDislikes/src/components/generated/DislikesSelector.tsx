import React, { useState, useCallback } from 'react';
interface DislikesSelectorProps {
  className?: string;
  style?: React.CSSProperties;
  onContinue?: (selectedFoods: string[], customDislikes: string) => void;
  onBack?: () => void;
  initialSelectedFoods?: string[];
}
export const DislikesSelector: React.FC<DislikesSelectorProps> = ({
  className = '',
  style = {},
  onContinue,
  onBack,
  initialSelectedFoods = ['Avocado', 'Fish', 'Tomatoe']
}) => {
  const [selectedFoods, setSelectedFoods] = useState<string[]>(initialSelectedFoods);
  const [customDislikes, setCustomDislikes] = useState<string>('');
  const foods = ['Avocado', 'Beets', 'Cauliflower', 'Brussels Sprouts', 'Bell Peppers', 'Fish', 'Tomatoe', 'Olives', 'Quinoa', 'Tofu', 'Turnips'];
  const toggleFood = (food: string) => {
    setSelectedFoods(prev => prev.includes(food) ? prev.filter(f => f !== food) : [...prev, food]);
  };
  const handleContinue = useCallback(() => {
    if (onContinue) {
      onContinue(selectedFoods, customDislikes);
    }
  }, [onContinue, selectedFoods, customDislikes]);
  return <div className={`select-dislikes ${className}`.trim()} style={{
    width: '100%',
    maxWidth: '1440px',
    minHeight: '1024px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    paddingLeft: '16px',
    paddingRight: '13px',
    paddingTop: '54px',
    paddingBottom: '137px',
    backgroundColor: 'rgba(242, 248, 245, 1)',
    boxSizing: 'border-box',
    borderRadius: '20px',
    overflow: 'hidden',
    position: 'relative',
    fontFamily: '"Poppins", sans-serif',
    ...style
  }}>
      <button onClick={onBack} aria-label="Go back" style={{
      background: 'none',
      border: 'none',
      padding: 0,
      cursor: 'pointer',
      width: '24px',
      height: '24px',
      zIndex: 10,
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'opacity 0.2s ease'
    }} onMouseEnter={e => e.currentTarget.style.opacity = '0.7'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
        <img src="https://storage.googleapis.com/storage.magicpath.ai/user/392816559460073472/figma-assets/d7f1ad6c-bf39-476b-bb7a-1be8a16f3ded.svg" alt="" style={{
        width: '100%',
        height: '100%'
      }} />
      </button>

      <div className="frame-40" style={{
      width: 'calc(100% - 32px)',
      maxWidth: '1408px',
      height: '12px',
      display: 'flex',
      flexDirection: 'row',
      gap: '6px',
      boxSizing: 'border-box',
      position: 'absolute',
      left: '19px',
      top: '117px',
      zIndex: 2
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
      </div>

      <main className="frame-41" style={{
      marginTop: '112px',
      width: '100%',
      maxWidth: '1408px',
      height: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '32px',
      boxSizing: 'border-box',
      flexShrink: 0,
      zIndex: 1,
      position: 'relative'
    }}>
        <h1 style={{
        margin: 0,
        color: 'rgba(26, 26, 26, 1)',
        fontSize: '32px',
        fontWeight: 700,
        lineHeight: '38.4px',
        letterSpacing: '-1.6px',
        textAlign: 'left'
      }}>
          How about dislikes?
        </h1>
        
        <div className="frame-3" role="group" aria-label="Food dislike selection" style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '12px',
        flexWrap: 'wrap',
        boxSizing: 'border-box',
        width: '100%'
      }}>
          {foods.map(food => {
          const isSelected = selectedFoods.includes(food);
          return <button key={food} onClick={() => toggleFood(food)} type="button" aria-pressed={isSelected} style={{
            width: 'auto',
            display: 'flex',
            alignItems: 'center',
            padding: '16px 24px',
            gap: '12px',
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
                  {food}
                </span>
              </button>;
        })}
        </div>
      </main>

      <section style={{
      position: 'relative',
      marginTop: '64px',
      height: ""
    }}>
        <h2 style={{
        margin: 0,
        width: '100%',
        maxWidth: '568px',
        color: 'rgba(26, 26, 26, 1)',
        fontSize: '32px',
        fontWeight: 700,
        lineHeight: '38.4px',
        letterSpacing: '-1.6px',
        textAlign: 'left',
        marginBottom: '37px',
        height: "38px",
        translate: "0px -20px"
      }}>
          Don’t see a disliked food? Add it below
        </h2>

        <div className="field-default" style={{
        width: '100%',
        maxWidth: '1405px',
        display: 'flex',
        backgroundColor: 'rgba(255, 255, 255, 1)',
        borderColor: 'rgba(204, 204, 204, 1)',
        borderStyle: 'solid',
        borderWidth: '1px',
        boxSizing: 'border-box',
        borderRadius: '16px',
        overflow: 'hidden',
        padding: '16px 20px',
        translate: "0px -15px",
        height: "420px"
      }}>
          <textarea value={customDislikes} onChange={e => setCustomDislikes(e.target.value)} placeholder='Ex. “I dislike cheese and broccoli”' style={{
          width: '100%',
          height: '100%',
          border: 'none',
          outline: 'none',
          resize: 'none',
          color: 'rgba(26, 26, 26, 1)',
          fontSize: '18px',
          fontFamily: '"Poppins", sans-serif',
          fontWeight: 400,
          lineHeight: '25.2px',
          backgroundColor: 'transparent'
        }} />
        </div>
      </section>

      <div style={{
      display: 'flex',
      justifyContent: 'center',
      marginTop: '28px',
      width: '100%',
      height: "",
      translate: "0px -28px"
    }}>
        <button className="button" onClick={handleContinue} style={{
        width: '100%',
        maxWidth: '397px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '16px 24px',
        backgroundColor: 'rgba(31, 143, 99, 1)',
        border: 'none',
        borderRadius: '16px',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease, transform 0.1s ease',
        zIndex: 4,
        height: ""
      }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(25, 120, 83, 1)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(31, 143, 99, 1)'} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'} type="button">
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