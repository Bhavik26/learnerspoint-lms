import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { quizId, answers } = body;

    if (!quizId || !Array.isArray(answers)) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    let quiz = null;
    try {
      quiz = await db.quiz.findUnique({
        where: { id: quizId },
        include: {
          questions: true,
          module: true,
        },
      });
    } catch (dbErr) {
      console.warn("DB offline. Using mock quiz data for submission evaluation.");
    }

    if (!quiz) {
      const correctCount = answers.filter(a => a === 0).length;
      const totalCount = answers.length || 3;
      const score = Math.round((correctCount / totalCount) * 100);
      const xpEarned = score >= 60 ? 100 : 0;
      
      return NextResponse.json({
        success: true,
        mocked: true,
        correctCount,
        totalCount,
        score,
        xpEarned,
        userXp: {
          currentXp: 320 + xpEarned,
          globalRank: 3,
        }
      });
    }

    const questions = quiz.questions;
    let correctCount = 0;
    
    questions.forEach((q, idx) => {
      if (answers[idx] !== undefined && answers[idx] === q.correctOption) {
        correctCount++;
      }
    });

    const totalCount = questions.length;
    const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 100;
    const isPassing = score >= 60;
    const xpEarned = isPassing ? quiz.xpReward : 0;

    let userXpRecord = null;

    if (xpEarned > 0) {
      userXpRecord = await db.userXP.upsert({
        where: { userId },
        update: {
          currentXp: {
            increment: xpEarned,
          },
        },
        create: {
          userId,
          currentXp: xpEarned,
          globalRank: 0,
        },
      });

      try {
        const allXp = await db.userXP.findMany({
          orderBy: { currentXp: "desc" },
        });

        for (let i = 0; i < allXp.length; i++) {
          await db.userXP.update({
            where: { id: allXp[i].id },
            data: { globalRank: i + 1 },
          });
        }

        userXpRecord = await db.userXP.findUnique({
          where: { userId },
        });
      } catch (rankErr) {
        console.warn("Rank recalculation failed", rankErr);
      }
    } else {
      userXpRecord = await db.userXP.findUnique({ where: { userId } });
    }

    try {
      const enrollment = await db.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: quiz.module.courseId,
          },
        },
      });

      if (enrollment) {
        const newScore = enrollment.aggregateScore === 0 
          ? score 
          : parseFloat(((enrollment.aggregateScore + score) / 2).toFixed(1));

        await db.enrollment.update({
          where: { id: enrollment.id },
          data: {
            aggregateScore: newScore,
          },
        });
      }
    } catch (enrollErr) {
      console.warn("Enrollment score update failed", enrollErr);
    }

    return NextResponse.json({
      success: true,
      correctCount,
      totalCount,
      score,
      xpEarned,
      userXp: userXpRecord || { currentXp: 0, globalRank: 0 },
    });

  } catch (error) {
    console.error("Quiz submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
