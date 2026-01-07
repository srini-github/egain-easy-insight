/**
 * Related Questions - Shows clickable suggestion chips below AI answer
 * Matches eGain's related questions UI pattern
 */
const RelatedQuestions = ({ query, onQuestionClick }) => {
	// Generate related questions based on query context
	const getRelatedQuestions = (q) => {
		const lower = q.toLowerCase();

		if (lower.includes('password') || lower.includes('reset')) {
			return [
				'What is the password policy?',
				'How do I enable 2FA?',
				'Why is my account locked?',
				'Password reset not working'
			];
		}
		if (lower.includes('mobile') || lower.includes('app') || lower.includes('crash')) {
			return [
				'How to update the mobile app?',
				'Check device compatibility',
				'Clear app cache and data',
				'Contact mobile support team'
			];
		}
		if (lower.includes('payment') || lower.includes('billing') || lower.includes('invoice')) {
			return [
				'How do I view my billing history?',
				'What payment methods are accepted?',
				'How do I dispute a charge?',
				'Update billing address'
			];
		}
		if (lower.includes('outlook') || lower.includes('sync')) {
			return [
				'What is Outlook sync?',
				'Why is sync failing?',
				'How do I configure Outlook?',
				'Sync error troubleshooting'
			];
		}
		if (lower.includes('security') || lower.includes('policy')) {
			return [
				'What are the security policies?',
				'How do I request access?',
				'Security audit process',
				'Compliance requirements'
			];
		}
		return [
			'How can I get more help?',
			'Contact support',
			'View all articles',
			'Submit feedback'
		];
	};

	const questions = getRelatedQuestions(query);

	return (
		<div style={{ marginTop: '16px' }}>
			<div style={{
				fontSize: '0.75rem',
				fontWeight: 600,
				color: 'var(--text-secondary)',
				textTransform: 'uppercase',
				letterSpacing: '0.5px',
				marginBottom: '10px'
			}}>
				Follow-up:
			</div>
			<div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
				{questions.map((question, index) => (
					<button
						key={index}
						onClick={() => onQuestionClick && onQuestionClick(question)}
						style={{
							padding: '6px 14px',
							background: '#fff',
							border: '1px solid var(--border-color)',
							borderRadius: '16px',
							fontSize: '0.8rem',
							color: 'var(--text-primary)',
							cursor: 'pointer',
							transition: 'all 0.2s',
							whiteSpace: 'nowrap'
						}}
						onMouseEnter={(e) => {
							e.target.style.borderColor = 'var(--primary-color)';
							e.target.style.color = 'var(--primary-color)';
						}}
						onMouseLeave={(e) => {
							e.target.style.borderColor = 'var(--border-color)';
							e.target.style.color = 'var(--text-primary)';
						}}
					>
						{question}
					</button>
				))}
			</div>
		</div>
	);
};

export default RelatedQuestions;
