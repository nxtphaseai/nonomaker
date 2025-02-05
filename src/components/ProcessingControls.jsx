function ProcessingControls({ onImageAccept }) {
  const resetControls = () => {
    setContrast(1)
    setBrightness(1)
    setSaturation(1)
    setBlur(0)
  }

  const handleAcceptImage = () => {
    onImageAccept()
    resetControls() // Reset controls when accepting image
  }

  return (
    <div className="processing-controls">
      <div className="sliders">
        // ... existing slider controls ...
      </div>
      
      <button onClick={resetControls} className="reset-btn">
        Reset Controls
      </button>
      
      {onImageAccept && (
        <button onClick={handleAcceptImage} className="accept-btn">
          Use this image
        </button>
      )}
    </div>
  )
} 