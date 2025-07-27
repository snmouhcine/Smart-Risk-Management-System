import React, { useState, useRef, useEffect } from 'react'

export const HoverCard = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const timeoutRef = useRef(null)
  const containerRef = useRef(null)
  
  const triggerChild = React.Children.toArray(children).find(
    child => child.type === HoverCardTrigger || child.props?.isHoverCardTrigger
  )
  
  const contentChild = React.Children.toArray(children).find(
    child => child.type === HoverCardContent || child.props?.isHoverCardContent
  )
  
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsOpen(true)
  }
  
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 100) // Small delay to allow moving to content
  }
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
  
  return (
    <div 
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div>
        {triggerChild}
      </div>
      {isOpen && (
        <div className="absolute z-50 mt-2 right-0">
          {contentChild}
        </div>
      )}
    </div>
  )
}

export const HoverCardTrigger = ({ children, asChild }) => {
  if (asChild) {
    return React.cloneElement(children, { isHoverCardTrigger: true })
  }
  return <div isHoverCardTrigger={true}>{children}</div>
}

export const HoverCardContent = ({ children, className = '' }) => {
  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 min-w-[280px] ${className}`}
      isHoverCardContent={true}
      onMouseDown={(e) => e.preventDefault()} // Prevent blur on click
    >
      {children}
    </div>
  )
}