import React, { useState } from 'react';
interface UserSettingsProps {
  className?: string;
  style?: React.CSSProperties;
}
export const UserSettings: React.FC<UserSettingsProps> = ({
  className,
  style
}) => {
  const [activeTab, setActiveTab] = useState('Settings');
  const menuItems = [{
    id: 'profile',
    label: 'Profile Settings',
    icon: 'https://storage.googleapis.com/storage.magicpath.ai/user/392816559460073472/figma-assets/cdba4f59-051b-4622-868e-4ae92db793ba.svg',
    top: 529
  }, {
    id: 'preferences',
    label: 'Eating Preferences',
    icon: 'https://storage.googleapis.com/storage.magicpath.ai/user/392816559460073472/figma-assets/1cf02bd4-828f-452f-a424-b47424da4c92.svg',
    top: 594
  }, {
    id: 'recipes',
    label: 'Your Recipes',
    icon: 'https://storage.googleapis.com/storage.magicpath.ai/user/392816559460073472/figma-assets/af02a133-312e-47c0-b793-2fdc166b6372.svg',
    top: 659
  }, {
    id: 'share',
    label: 'Share Forka',
    icon: 'https://storage.googleapis.com/storage.magicpath.ai/user/392816559460073472/figma-assets/0859626c-5421-4eaa-a85e-31419e3e16c0.svg',
    top: 724
  }, {
    id: 'team',
    label: 'Meet Our Team',
    icon: 'https://storage.googleapis.com/storage.magicpath.ai/user/392816559460073472/figma-assets/b9a41cd6-f1b7-4380-8812-4c82c3b17f1d.svg',
    top: 789
  }] as any[];
  const dividers = [584, 649, 714, 779, 844];
  const handleMenuClick = (label: string) => {
    console.log(`Navigating to ${label}`);
  };
  const handleUpgrade = () => {
    console.log('Upgrade button clicked');
  };
  return <div className={`user-settings ${className || ''}`.trim()} style={{
    width: '100%',
    maxWidth: '430px',
    height: '932px',
    backgroundColor: 'rgba(242, 248, 245, 1)',
    boxSizing: 'border-box',
    borderRadius: '20px',
    overflow: 'hidden',
    position: 'relative',
    margin: '0 auto',
    boxShadow: '0px 4px 20px rgba(0,0,0,0.1)',
    ...style
  }}>
      {/* Header */}
      <h1 style={{
      margin: 0,
      width: '125px',
      height: '38px',
      color: 'rgba(26, 26, 26, 1)',
      fontSize: '32px',
      fontFamily: '"Poppins", sans-serif',
      fontWeight: 700,
      lineHeight: '38.4px',
      letterSpacing: '-1.6px',
      textAlign: 'left',
      position: 'absolute',
      left: '16px',
      top: '57px'
    }}>
        Settings
      </h1>

      {/* Profile Avatar & Badge */}
      <div style={{
      position: 'absolute',
      left: '156px',
      top: '127px',
      width: '98px',
      height: '98px'
    }}>
        <img src="https://storage.googleapis.com/storage.magicpath.ai/user/392816559460073472/figma-assets/53ca5ad5-5445-41dc-9be4-401aca6d5a1c.png" alt="User Avatar" style={{
        width: '90px',
        height: '90px',
        borderColor: 'rgba(230, 230, 230, 1)',
        borderStyle: 'solid',
        borderWidth: '4px',
        borderRadius: '60px',
        objectFit: 'cover'
      }} />
        <div style={{
        width: '53px',
        height: '26px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(51, 153, 91, 1)',
        borderColor: 'rgba(242, 248, 245, 1)',
        borderStyle: 'solid',
        borderWidth: '4px',
        borderRadius: '30px',
        position: 'absolute',
        left: '63px',
        top: '64px'
      }}>
          <span style={{
          color: 'rgba(255, 255, 255, 1)',
          fontSize: '16px',
          fontFamily: '"Poppins", sans-serif',
          fontWeight: 700
        }}>FREE</span>
        </div>
      </div>

      {/* Email Row */}
      <button onClick={() => handleMenuClick('Account')} style={{
      background: 'none',
      border: 'none',
      padding: 0,
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: '6px',
      position: 'absolute',
      left: '114px',
      top: '229px',
      cursor: 'pointer',
      outline: 'none'
    }}>
        <span style={{
        color: 'rgba(102, 102, 102, 1)',
        fontSize: '18px',
        fontFamily: '"DM Sans", sans-serif',
        fontWeight: 400
      }}>ramy@example.co.uk</span>
        <img src="https://storage.googleapis.com/storage.magicpath.ai/user/392816559460073472/figma-assets/4c32ffd9-59ca-4eaf-a99f-71650e80fb3d.svg" alt="Chevron" style={{
        width: '20px',
        height: '20px'
      }} />
      </button>

      {/* Upgrade Card */}
      <div style={{
      width: '398px',
      height: '237px',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px',
      gap: '20px',
      backgroundColor: 'rgba(255, 228, 194, 1)',
      boxSizing: 'border-box',
      borderRadius: '20px',
      position: 'absolute',
      left: '16px',
      top: '286px'
    }}>
        <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
          <span style={{
          color: 'rgba(26, 26, 26, 1)',
          fontSize: '24px',
          fontFamily: '"Poppins", sans-serif',
          fontWeight: 700
        }}>Upgrade to Pro</span>
          <span style={{
          color: 'rgba(102, 102, 102, 1)',
          fontSize: '18px',
          fontFamily: '"Poppins", sans-serif',
          fontWeight: 400,
          lineHeight: '25.2px'
        }}>Get exclusive recipes, nutritional information, advanced filters, and more.</span>
        </div>
        <button onClick={handleUpgrade} style={{
        height: '57px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(31, 143, 99, 1)',
        border: 'none',
        borderRadius: '16px',
        cursor: 'pointer',
        transition: 'transform 0.1s ease, opacity 0.2s ease'
      }} onMouseEnter={e => e.currentTarget.style.opacity = '0.9'} onMouseLeave={e => e.currentTarget.style.opacity = '1'} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
          <span style={{
          color: 'rgba(250, 250, 250, 1)',
          fontSize: '18px',
          fontFamily: '"Poppins", sans-serif',
          fontWeight: 700
        }}>Upgrade Now!</span>
        </button>
      </div>

      {/* Menu List */}
      {menuItems.map(item => <button key={item.id} onClick={() => handleMenuClick(item.label)} style={{
      position: 'absolute',
      left: '16px',
      top: `${item.top}px`,
      width: '398px',
      height: '50px',
      background: 'none',
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
      padding: '0 14px',
      borderRadius: '12px',
      transition: 'background-color 0.2s ease',
      textAlign: 'left'
    }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(31, 143, 99, 0.05)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
          <img src={item.icon} alt="" style={{
        width: '24px',
        height: '24px',
        position: 'absolute',
        left: '14px'
      }} />
          <span style={{
        color: 'rgba(26, 26, 26, 1)',
        fontSize: '18px',
        fontFamily: '"Poppins", sans-serif',
        fontWeight: 700,
        position: 'absolute',
        left: '62px'
      }}>
            {item.label}
          </span>
          <img src="https://storage.googleapis.com/storage.magicpath.ai/user/392816559460073472/figma-assets/af5feea8-f8fd-475e-b069-854ce553cc3a.svg" alt="" style={{
        width: '24px',
        height: '24px',
        position: 'absolute',
        right: '0px'
      }} />
        </button>)}

      {/* Dividers */}
      {dividers.map((top, index) => <div key={index} style={{
      width: '398px',
      height: '0',
      position: 'absolute',
      left: '16px',
      top: `${top}px`,
      borderTop: '1px solid rgba(204, 204, 204, 1)'
    }} />)}

      {/* Navigation Bar */}
      <nav style={{
      width: '100%',
      height: '86px',
      backgroundColor: 'rgba(255, 255, 255, 1)',
      boxShadow: '0px -10px 16px rgba(67, 61, 55, 0.06)',
      position: 'absolute',
      left: '0px',
      bottom: '0px',
      display: 'flex',
      justifyContent: 'center'
    }}>
        <div style={{
        width: '359px',
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
          {[{
          id: 'Meal Plan',
          icon: 'https://storage.googleapis.com/storage.magicpath.ai/user/392816559460073472/figma-assets/73888c45-b559-4903-8a56-3173967ca73e.svg'
        }, {
          id: 'Groceries',
          icon: 'https://storage.googleapis.com/storage.magicpath.ai/user/392816559460073472/figma-assets/e8f81a40-f39c-4e53-a15f-da7584a10895.svg'
        }, {
          id: 'Favorites',
          icon: 'https://storage.googleapis.com/storage.magicpath.ai/user/392816559460073472/figma-assets/5b2b874b-bae6-4b43-8992-804b804e5540.svg'
        }, {
          id: 'Settings',
          icon: 'https://storage.googleapis.com/storage.magicpath.ai/user/392816559460073472/figma-assets/55222e9b-53bf-4af1-aaf0-fc1318c655df.svg'
        }].map(item => <button key={item.id} onClick={() => setActiveTab(item.id)} style={{
          background: 'none',
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          cursor: 'pointer',
          padding: '8px',
          minWidth: '70px',
          opacity: activeTab === item.id ? 1 : 0.6,
          transition: 'opacity 0.2s ease'
        }}>
              <img src={item.icon} alt={item.id} style={{
            width: '24px',
            height: '24px'
          }} />
              <span style={{
            color: activeTab === item.id ? 'rgba(31, 143, 99, 1)' : 'rgba(179, 179, 179, 1)',
            fontSize: '12px',
            fontFamily: '"DM Sans", sans-serif',
            fontWeight: 500
          }}>
                {item.id}
              </span>
            </button>)}
        </div>
      </nav>
    </div>;
};