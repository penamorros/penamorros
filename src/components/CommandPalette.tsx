import React, { useState, useEffect, useRef } from 'react'
import { Search, Home, Heart, Zap, FileText, FolderOpen, Mail, X, Command } from 'lucide-react'

interface CommandPaletteProps {
	sections: Array<{ id: string; label: string; icon: React.ComponentType<any> }>
	onNavigate: (id: string) => void
	onClose: () => void
	isOpen: boolean
}

export default function CommandPalette({ sections, onNavigate, onClose, isOpen }: CommandPaletteProps) {
	const [query, setQuery] = useState('')
	const [selectedIndex, setSelectedIndex] = useState(0)
	const inputRef = useRef<HTMLInputElement>(null)
	const listRef = useRef<HTMLDivElement>(null)

	const filteredSections = sections.filter(section =>
		section.label.toLowerCase().includes(query.toLowerCase()) ||
		section.id.toLowerCase().includes(query.toLowerCase())
	)

	useEffect(() => {
		if (isOpen && inputRef.current) {
			inputRef.current.focus()
		}
	}, [isOpen])

	useEffect(() => {
		if (!isOpen) {
			setQuery('')
			setSelectedIndex(0)
		}
	}, [isOpen])

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!isOpen) return

			if (e.key === 'ArrowDown') {
				e.preventDefault()
				setSelectedIndex(prev => (prev + 1) % filteredSections.length)
			} else if (e.key === 'ArrowUp') {
				e.preventDefault()
				setSelectedIndex(prev => (prev - 1 + filteredSections.length) % filteredSections.length)
			} else if (e.key === 'Enter') {
				e.preventDefault()
				if (filteredSections[selectedIndex]) {
					onNavigate(filteredSections[selectedIndex].id)
					onClose()
				}
			} else if (e.key === 'Escape') {
				e.preventDefault()
				onClose()
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [isOpen, filteredSections, selectedIndex, onNavigate, onClose])

	useEffect(() => {
		if (listRef.current && selectedIndex >= 0) {
			const selectedElement = listRef.current.children[selectedIndex] as HTMLElement
			if (selectedElement) {
				selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
			}
		}
	}, [selectedIndex])

	if (!isOpen) return null

	return (
		<div className="command-palette-overlay" onClick={onClose}>
			<div className="command-palette" onClick={(e) => e.stopPropagation()}>
				<div className="command-palette-header">
					<Search size={20} />
					<input
						ref={inputRef}
						type="text"
						placeholder="Search sections..."
						value={query}
						onChange={(e) => {
							setQuery(e.target.value)
							setSelectedIndex(0)
						}}
						className="command-palette-input"
						aria-label="Command palette search"
					/>
					<button
						onClick={onClose}
						className="command-palette-close"
						aria-label="Close command palette"
					>
						<X size={20} />
					</button>
				</div>
				<div className="command-palette-list" ref={listRef}>
					{filteredSections.length === 0 ? (
						<div className="command-palette-empty">No results found</div>
					) : (
						filteredSections.map((section, index) => {
							const IconComponent = section.icon
							return (
								<button
									key={section.id}
									className={`command-palette-item ${index === selectedIndex ? 'selected' : ''}`}
									onClick={() => {
										onNavigate(section.id)
										onClose()
									}}
									onMouseEnter={() => setSelectedIndex(index)}
								>
									<IconComponent size={20} />
									<span>{section.label}</span>
									{index === selectedIndex && (
										<span className="command-palette-hint">Press Enter</span>
									)}
								</button>
							)
						})
					)}
				</div>
				<div className="command-palette-footer">
					<div className="command-palette-shortcuts">
						<span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
						<span><kbd>Enter</kbd> Select</span>
						<span><kbd>Esc</kbd> Close</span>
					</div>
				</div>
			</div>
		</div>
	)
}

