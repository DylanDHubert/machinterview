# Interview Flow Documentation

## Overview
The interview system now implements a realistic interview flow with natural endpoints, structured phases, and automatic conclusion mechanisms to simulate real-world interview experiences.

## Interview Structure

### 1. Introduction Phase (0-2 questions)
- **Duration**: 2-3 minutes
- **Behavior**: 
  - Warm greeting and interviewer introduction
  - Opening question about candidate's interest in the role
  - Friendly, welcoming tone
- **UI Indicator**: Blue "Introduction" badge

### 2. Main Interview Phase (2-8 questions)
- **Duration**: 20-25 minutes
- **Behavior**:
  - Core interview questions based on resume and job description
  - Follow-up questions based on candidate responses
  - Covers experience, skills, problem-solving, cultural fit
- **UI Indicator**: Green "Main Interview" badge

### 3. Conclusion Phase (8-10 questions)
- **Duration**: 3-5 minutes
- **Behavior**:
  - Final 1-2 meaningful questions
  - Natural transition to wrap-up
  - Interviewer begins signaling the end
- **UI Indicator**: Yellow "Wrapping Up" badge
- **User Notification**: "Interview nearing completion" alert

### 4. Ended Phase (10+ questions or 30+ minutes)
- **Duration**: 1-2 minutes
- **Behavior**:
  - Thank you message
  - Summary of key strengths
  - Next steps information
  - Professional closing
- **UI Indicator**: Gray "Completed" badge
- **User Notification**: "Interview concluding" alert
- **Auto-End**: Interview automatically ends after conclusion

## Automatic Ending Mechanisms

### Primary Triggers
1. **Question Limit**: Interview concludes after 10 questions
2. **Time Limit**: Interview concludes after 30 minutes
3. **Natural Flow**: AI interviewer wraps up when appropriate

### Warning System
- **8 Questions**: "Approaching end" notification appears
- **25 Minutes**: Subtle signal sent to AI to begin wrapping up
- **10 Questions/30 Minutes**: Conclusion instructions sent to AI

### Auto-End Behavior
- AI receives explicit conclusion instructions
- 10-second grace period for final remarks
- Interview automatically terminates
- User returned to results view

## User Experience Features

### Progress Tracking
- **Real-time Timer**: Shows interview duration (MM:SS format)
- **Question Counter**: Tracks questions asked (X/10 format)
- **Progress Bar**: Visual progress indicator (0-100%)
- **Phase Badge**: Current interview phase indicator

### Notifications
- **Approaching End**: Shown at 8 questions (yellow alert)
- **Concluding**: Shown at 10 questions (blue alert)
- **Non-intrusive**: Alerts don't interrupt the flow

### Results Summary
- **Performance Rating**: Based on questions answered and duration
  - Excellent: 10+ questions
  - Good: 7-9 questions  
  - Fair: 5-6 questions
  - Brief: <5 questions
- **Statistics**: Duration, question count, completion status
- **Feedback**: Constructive performance summary

## AI Instructions

### Enhanced Context Messages
The AI interviewer receives comprehensive instructions including:
- Interview structure and phases
- Conversation rules and guidelines
- Natural conclusion requirements
- Professional closing standards

### Conclusion Triggers
- **Wrap-up Signal**: Sent at 8 questions or 25 minutes
- **Conclusion Instruction**: Sent at 10 questions or 30 minutes
- **Auto-termination**: Triggered 10 seconds after conclusion

### Professional Standards
- Conversational and natural tone
- One question at a time
- Relevant follow-up questions
- Genuine interest in responses
- Clear, professional conclusion

## Technical Implementation

### State Management
- `interviewStartTime`: Interview start timestamp
- `interviewDuration`: Real-time duration counter
- `conversationCount`: Total message count
- `questionCount`: User questions answered (conversationCount / 2)

### Phase Detection
```typescript
const phase = 
  !isSessionActive && interviewDuration > 0 ? 'ended' :
  Math.floor(conversationCount / 2) >= 8 ? 'conclusion' :
  Math.floor(conversationCount / 2) >= 2 ? 'main' : 'introduction'
```

### Auto-End Logic
```typescript
const shouldAutoEnd = userMessages.length >= 10 || interviewDuration >= 1800
const isApproachingEnd = userMessages.length >= 8 || interviewDuration >= 1500
```

## Benefits

### For Users
- **Realistic Experience**: Mimics actual interview timing and flow
- **Clear Expectations**: Visual indicators show progress and remaining time
- **No Abrupt Endings**: Natural, professional conclusion
- **Performance Feedback**: Constructive summary of interview performance

### For Interviewers (AI)
- **Structured Guidelines**: Clear instructions for each phase
- **Natural Transitions**: Smooth flow between phases
- **Professional Standards**: Consistent, high-quality interview experience
- **Appropriate Closure**: Proper ending with next steps

## Customization Options

### Adjustable Limits
- Question limit (currently 10)
- Time limit (currently 30 minutes)
- Warning thresholds (currently 8 questions, 25 minutes)

### Phase Timing
- Introduction phase duration
- Main interview phase length
- Conclusion phase requirements

### UI Components
- Progress indicator styling
- Notification timing and content
- Summary display format

This structured approach transforms the interview from an indefinite conversation into a realistic, time-bounded professional interaction that users can complete with confidence. 