# Interview Experience Improvement Plan

## Overview

This document outlines a comprehensive plan to improve the AI interviewer's behavior and create a more realistic, professional interview experience. The plan addresses critical bugs, architectural issues, and enhancement opportunities identified in the current implementation.

---

## Current Problems Identified

### Critical Issues

1. **Generic Initial Instructions** (`app/api/session/route.ts:19`)
   - Session is created with generic assistant prompt: "Hello, how can I help you today?"
   - AI acts like a general assistant instead of an interviewer
   - This is the root cause of poor interview behavior

2. **Easter Egg Breaking Professionalism** (`app/page.tsx:277`)
   - Voice "ash" introduces AI as: "Dwayne 'The Rock' Johnson and I am the worst, most demonic fucker you have ever seen"
   - Completely ruins the interview experience

3. **Delayed Context Injection** (`app/page.tsx:465`)
   - Interview instructions sent 1 second AFTER session starts
   - AI might start speaking before context arrives
   - System messages sent as `role: "user"` instead of true system instructions
   - Not as authoritative as initial session configuration

### Design Issues

4. **Long Context Messages**
   - 400+ lines of detailed instructions sent as a single message
   - May get truncated, diluted, or partially ignored by the AI

5. **Multiple Competing Messages**
   - Generic assistant instructions (session creation)
   - Language preference message (`configureDataChannel`)
   - Interview context (delayed system message)
   - Result: Conflicting instructions confuse AI behavior

6. **Auto-Conclusion Interruptions** (`app/page.tsx:162-198`)
   - Conclusion messages sent mid-interview when limits reached
   - Might feel abrupt or unnatural if AI is mid-question

---

## Improvement Plan

### Phase 1: Fix Critical Bugs (Tasks 1-2)

#### Task 1: Remove Dwayne Johnson Easter Egg
**File**: `app/page.tsx:277`

**Changes**:
- Replace unprofessional "ash" voice name
- Use proper interviewer name like "Alex" or "Jordan"
- Maintain consistency with other voice names

**Expected Outcome**: Professional introduction regardless of voice selection

---

#### Task 2: Create Helper Function for Instructions
**File**: Create new `lib/interview-instructions.ts`

**Changes**:
- Build centralized function to generate interviewer instructions
- Accept parameters: `resumeData`, `jobData`, `interviewerName`, `locale`
- Return optimized prompt based on available context
- Ensure consistency and easier testing/iteration

**Function Signature**:
```typescript
export function generateInterviewInstructions(params: {
  resumeData?: ResumeData;
  jobData?: JobDetails;
  interviewerName: string;
  locale?: string;
}): string
```

**Expected Outcome**: Consistent, maintainable instruction generation

---

### Phase 2: Architectural Refactor (Tasks 3-6)

#### Task 3: Update /api/session Endpoint
**File**: `app/api/session/route.ts`

**Changes**:
- Change from empty POST to accept request body
- Accept parameters: `voice`, `resumeData`, `jobData`, `interviewerName`, `locale`
- Generate proper instructions server-side using helper function
- Pass instructions to OpenAI session creation

**New Endpoint Signature**:
```typescript
POST /api/session
Body: {
  voice: string;
  resumeData?: object;
  jobData?: object;
  interviewerName: string;
  locale?: string;
}
```

**Expected Outcome**: Session created with proper interview instructions from the start

---

#### Task 4: Move Instructions to Session Creation
**File**: `app/api/session/route.ts:19`

**Changes**:
- Replace generic instructions with interview-specific instructions
- Use helper function to generate context-aware prompt
- Set proper interviewer personality from session initialization
- Include resume and job context in initial instructions

**Before**:
```typescript
instructions: "Start conversation with the user by saying 'Hello, how can I help you today?'..."
```

**After**:
```typescript
instructions: generateInterviewInstructions({
  resumeData: body.resumeData,
  jobData: body.jobData,
  interviewerName: body.interviewerName,
  locale: body.locale
})
```

**Expected Outcome**: AI behaves as interviewer from first word spoken

---

#### Task 5: Simplify Interviewer Prompt
**File**: `lib/interview-instructions.ts`

**Changes**:
- Reduce verbose 400+ line instructions to ~150 lines
- Focus on core behaviors:
  - Ask one question at a time
  - Wait for complete responses
  - Ask natural follow-up questions
  - Be conversational and professional
- Use clearer structure:
  - **WHO**: Your identity and role
  - **WHAT**: The interview context (resume/job)
  - **HOW**: Behavior guidelines and conversation rules
  - **WHEN**: When to conclude

**Structure**:
```markdown
1. Identity (2-3 lines): Who you are, your name
2. Context (variable): Resume summary, job description
3. Interview Guidelines (10-12 rules): Core behaviors
4. Conclusion Criteria (2-3 lines): When and how to wrap up
```

**Expected Outcome**: AI follows instructions more reliably with clearer, shorter prompt

---

#### Task 6: Remove Delayed setTimeout
**File**: `app/page.tsx:465-515`

**Changes**:
- Delete `setTimeout(() => sendSystemMessage(contextMessage), 1000)`
- Remove redundant context message logic
- Instructions now handled in session creation

**Expected Outcome**: Eliminates race condition, faster interview start

---

### Phase 3: Enhanced Intelligence (Tasks 7-9)

#### Task 7: Add Dynamic Session Instructions
**File**: `lib/interview-instructions.ts`

**Changes**:
- Create 3 instruction variants based on available data:
  1. **Full Context** (Resume + Job Description): Tailor questions to role and background
  2. **Resume Only**: General career interview about their experience
  3. **Job Only**: Role-specific questions without personal background
- Adjust AI behavior based on available data
- Include appropriate opening questions for each scenario

**Expected Outcome**: AI adapts questioning style to available context

---

#### Task 8: Improve Auto-Conclusion Logic
**File**: `app/page.tsx:146-200`

**Changes**:
- Check if AI is currently speaking before sending conclusion message
- Wait for current AI response to complete (check `conversation` for active assistant message)
- Add graceful transition message
- Prevent abrupt mid-question interruptions
- Consider using state flag: `isAiResponding`

**Improved Logic**:
```typescript
if (shouldAutoEnd && !isAiCurrentlySpeaking && userMessages.length > 0) {
  // Send conclusion message
}
```

**Expected Outcome**: Natural, non-disruptive interview conclusions

---

#### Task 9: Add Interviewer Behavior Guidelines
**File**: `lib/interview-instructions.ts`

**Changes**:
- Add behavioral interview techniques (STAR method guidance)
- Include examples of good follow-up questions:
  - "Can you tell me more about..."
  - "What was your role in..."
  - "How did you approach..."
- Add pacing guidance:
  - Don't rush through questions
  - Show genuine interest in responses
  - Allow natural pauses
- Include tone guidelines:
  - Professional but friendly
  - Encouraging
  - Avoid being robotic

**Expected Outcome**: More engaging, realistic interview conversations

---

### Phase 4: Testing & Validation (Task 10)

#### Task 10: Test Interview Flow
**Files**: All modified files

**Test Cases**:
1. **Full Context Test**:
   - Upload resume + add job description
   - Start interview
   - Validate: AI introduces self correctly, asks relevant questions, follows up naturally

2. **Resume Only Test**:
   - Upload resume, skip job description
   - Validate: AI asks general career questions

3. **Job Only Test**:
   - Skip resume, add job description
   - Validate: AI asks role-specific questions

4. **Auto-Conclusion Test**:
   - Run interview to 10 questions
   - Validate: AI wraps up gracefully without interruption

5. **Voice Selection Test**:
   - Test all voice options
   - Validate: Professional introductions for all voices

6. **Pause/Resume Test**:
   - Pause mid-interview
   - Validate: AI resumes naturally

**Success Criteria**:
- AI introduces itself as interviewer (not assistant)
- Questions are relevant to resume/job from start
- One question at a time (no question lists)
- Natural follow-up questions based on responses
- Smooth conclusion without interruptions
- Professional tone throughout

**Expected Outcome**: Validated, production-ready interview experience

---

## Implementation Order

### Priority 1 (Immediate Impact)
1. Task 1: Remove Dwayne Johnson easter egg
2. Task 4: Move instructions to session creation
3. Task 6: Remove delayed setTimeout

### Priority 2 (Architecture)
4. Task 2: Create helper function
5. Task 3: Update /api/session endpoint
6. Task 7: Add dynamic session instructions

### Priority 3 (Polish)
7. Task 5: Simplify interviewer prompt
8. Task 9: Add interviewer behavior guidelines
9. Task 8: Improve auto-conclusion logic

### Priority 4 (Validation)
10. Task 10: Test interview flow

---

## Expected Outcomes

After completing this plan:

✅ **Professional First Impression** - AI introduces itself properly as an interviewer from the first word

✅ **Relevant Questions** - AI asks questions based on resume/job from the very start

✅ **Natural Conversation** - One question at a time, thoughtful follow-ups based on responses

✅ **Smooth Conclusion** - Graceful wrap-up without abrupt interruptions

✅ **Consistent Behavior** - Instructions set correctly from session initialization, not mid-session

✅ **Better AI Compliance** - Shorter, clearer instructions lead to more reliable behavior

✅ **Maintainable Code** - Centralized instruction generation, easier to test and iterate

---

## Key Insight

The fundamental problem is architectural: **The AI's role must be set correctly from the beginning** rather than trying to course-correct mid-session with system messages.

By moving interview instructions from a delayed system message to the initial session creation, we ensure the AI embodies the interviewer role from its first utterance.

---

## Files to Modify

1. `app/api/session/route.ts` - Accept context, use proper instructions
2. `app/page.tsx` - Remove delayed messages, call updated endpoint
3. `lib/interview-instructions.ts` - New file for instruction generation
4. `hooks/use-webrtc.ts` - Minor updates if needed for session params

---

## Rollback Plan

If issues arise:
1. Git revert to previous commit
2. Keep session endpoint backward compatible during transition
3. Use feature flag to toggle between old/new instruction methods

---

## Success Metrics

- User feedback: "AI felt like a real interviewer"
- Reduced number of off-topic or generic responses
- Higher completion rate of interviews
- Positive sentiment in interview transcripts

---

## Notes

- Test thoroughly with different resume/job combinations
- Consider adding interview type selection (technical, behavioral, case study)
- Future enhancement: Allow users to customize interviewer personality
- Monitor OpenAI token usage - shorter instructions may reduce costs

---

*Created: 2025-10-29*
*Status: Planning Complete - Ready for Implementation*
