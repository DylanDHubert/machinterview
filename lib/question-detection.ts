/**
 * Question Detection Utility
 * 
 * Intelligently detects actual questions asked by the AI interviewer,
 * accounting for multi-part questions and follow-up comments.
 */

import { Conversation } from './conversations'

/**
 * Detects if a message contains one or more questions
 * Returns the number of distinct questions found
 */
export function countQuestionsInMessage(text: string): number {
  if (!text || typeof text !== 'string') return 0
  
  // Remove common prefixes that might confuse detection
  const cleaned = text.trim()
  
  // Skip if it's clearly not a question (conclusion phrases, thank yous, etc.)
  const conclusionPhrases = [
    'thank you',
    'thanks for',
    'we\'ll be in touch',
    'next steps',
    'wrapping up',
    'to summarize',
    'in conclusion',
    'great interview',
    'appreciate your time'
  ]
  
  const lowerText = cleaned.toLowerCase()
  if (conclusionPhrases.some(phrase => lowerText.includes(phrase)) && !lowerText.includes('?')) {
    return 0 // This is a conclusion, not a question
  }
  
  // Split by sentence boundaries (periods, exclamation marks, question marks)
  // But be smart about it - don't split on abbreviations or decimals
  const sentences = cleaned
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .filter(s => s.trim().length > 0)
  
  let questionCount = 0
  
  for (const sentence of sentences) {
    const trimmed = sentence.trim()
    
    // Check if sentence ends with question mark
    if (trimmed.endsWith('?')) {
      // Additional check: make sure it's actually asking something
      // Skip rhetorical questions or statements with question marks
      const questionWords = [
        'what', 'when', 'where', 'who', 'why', 'how',
        'can you', 'could you', 'would you', 'do you', 'did you',
        'have you', 'are you', 'is there', 'tell me', 'describe',
        'explain', 'walk me through'
      ]
      
      const lowerSentence = trimmed.toLowerCase()
      const isActualQuestion = questionWords.some(word => 
        lowerSentence.includes(word) || 
        lowerSentence.startsWith('tell me') ||
        lowerSentence.startsWith('describe') ||
        lowerSentence.startsWith('explain')
      )
      
      if (isActualQuestion) {
        questionCount++
      }
    }
  }
  
  // If no question marks but contains question words/phrases, count as 1 question
  // This handles cases like "Tell me about your experience" without a question mark
  if (questionCount === 0 && sentences.length > 0) {
    const firstSentence = sentences[0].toLowerCase()
    const questionPhrases = [
      'tell me about',
      'describe',
      'explain',
      'walk me through',
      'can you tell me',
      'could you describe'
    ]
    
    if (questionPhrases.some(phrase => firstSentence.includes(phrase))) {
      questionCount = 1
    }
  }
  
  // Cap at 1 per message - multi-part questions count as one question
  // This prevents "What was your role? And how did you handle that?" from counting as 2
  return Math.min(questionCount, 1)
}

/**
 * Counts total questions asked across all assistant messages
 */
export function countTotalQuestions(conversation: Conversation[]): number {
  const assistantMessages = conversation.filter(
    msg => msg.role === 'assistant' && msg.isFinal
  )
  
  let totalQuestions = 0
  const processedMessages = new Set<string>() // Track processed messages by ID
  
  for (const message of assistantMessages) {
    // Skip if we've already processed this message
    if (processedMessages.has(message.id)) continue
    
    const questionsInMessage = countQuestionsInMessage(message.text)
    totalQuestions += questionsInMessage
    processedMessages.add(message.id)
  }
  
  return totalQuestions
}

/**
 * Gets the last N assistant messages that contain questions
 */
export function getRecentQuestions(conversation: Conversation[], count: number = 5): Conversation[] {
  const assistantMessages = conversation
    .filter(msg => msg.role === 'assistant' && msg.isFinal)
    .reverse() // Start from most recent
    .slice(0, count)
    .filter(msg => countQuestionsInMessage(msg.text) > 0)
  
  return assistantMessages.reverse() // Return in chronological order
}

