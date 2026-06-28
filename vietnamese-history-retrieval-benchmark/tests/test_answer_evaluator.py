import json

import pandas as pd

from src.evaluation.answer_evaluator import ANSWER_EVALUATION_COLUMNS, evaluate_answers


def test_evaluate_answers_scores_correct_and_faithful_answer():
    questions = pd.DataFrame([
        {
            "qid": "SQ0003",
            "question": "Năm 981 có sự kiện gì liên quan đến Hầu Nhân Bảo?",
            "question_type": "fact_date",
            "proposed_answer": "Năm 981, quân của Hầu Nhân Bảo kéo vào nước ta.",
        }
    ])
    qrels = pd.DataFrame([
        {
            "qid": "SQ0003",
            "chunk_id": "D002_C0100",
            "doc_id": "D002",
            "page_number": "105",
            "relevance": "1",
            "verified": "false",
            "label_quality": "silver",
            "answer_text": "Năm 981, quân của Hầu Nhân Bảo kéo vào nước ta.",
            "evidence_note": "Tân Tỵ (981), quân của Hầu Nhân Bảo kéo vào nước ta.",
        }
    ])
    chat_results = pd.DataFrame([
        {
            "qid": "SQ0003",
            "actual_answer": "Năm 981, quân của Hầu Nhân Bảo kéo vào nước ta [C1].",
            "citations": json.dumps([
                {"doc_id": "D002", "page_number": 105, "chunk_id": "D002_C0100"}
            ]),
        }
    ])

    evaluation, metrics = evaluate_answers(questions, qrels, chat_results, include_silver=True)

    assert list(evaluation.columns) == ANSWER_EVALUATION_COLUMNS
    row = evaluation.iloc[0]
    assert row["correctness_score"] == "3"
    assert row["faithfulness_score"] == "3"
    assert row["hallucination_flag"] == "false"
    assert row["citation_hit"] == "true"
    assert metrics.iloc[0]["mean_correctness_score"] == "3.000000"


def test_evaluate_answers_flags_unsupported_wrong_answer_as_hallucination():
    questions = pd.DataFrame([
        {
            "qid": "Q1",
            "question": "Nhà Trần thành lập năm nào?",
            "question_type": "fact_date",
            "expected_answer": "Nhà Trần thành lập năm 1225.",
        }
    ])
    qrels = pd.DataFrame([
        {
            "qid": "Q1",
            "chunk_id": "D002_C0001",
            "doc_id": "D002",
            "page_number": "10",
            "relevance": "1",
            "verified": "true",
            "evidence_note": "Nhà Trần thành lập năm 1225.",
        }
    ])
    chat_results = pd.DataFrame([
        {
            "qid": "Q1",
            "actual_answer": "Nhà Trần thành lập năm 1400.",
            "citations": "",
        }
    ])

    evaluation, _ = evaluate_answers(questions, qrels, chat_results)

    row = evaluation.iloc[0]
    assert row["correctness_score"] == "1"
    assert row["faithfulness_score"] == "0"
    assert row["hallucination_flag"] == "true"
    assert "Missing expected year" in row["judge_notes"]


def test_evaluate_answers_scores_no_answer_refusal():
    questions = pd.DataFrame([
        {
            "qid": "NO1",
            "question": "Nhân vật không có trong dữ liệu là ai?",
            "question_type": "no_answer",
        }
    ])
    qrels = pd.DataFrame([
        {
            "qid": "NO1",
            "chunk_id": "",
            "doc_id": "",
            "page_number": "",
            "relevance": "NONE",
            "verified": "true",
        }
    ])
    chat_results = pd.DataFrame([
        {
            "qid": "NO1",
            "actual_answer": "Hiện tại dữ liệu trong hệ thống chưa đủ để kết luận chắc chắn.",
            "citations": "[]",
        }
    ])

    evaluation, metrics = evaluate_answers(questions, qrels, chat_results)

    row = evaluation.iloc[0]
    assert row["expected_answer"] == "NO_ANSWER"
    assert row["correctness_score"] == "3"
    assert row["faithfulness_score"] == "3"
    assert row["hallucination_flag"] == "false"
    assert metrics.iloc[0]["no_answer_accuracy"] == "1.000000"


def test_evaluate_answers_marks_missing_ground_truth_without_guessing_scores():
    questions = pd.DataFrame([
        {"qid": "Q2", "question": "Câu hỏi chưa có nhãn?", "question_type": "event"}
    ])
    qrels = pd.DataFrame(columns=["qid", "relevance", "verified"])
    chat_results = pd.DataFrame([
        {"qid": "Q2", "actual_answer": "Một câu trả lời.", "citations": "[]"}
    ])

    evaluation, metrics = evaluate_answers(questions, qrels, chat_results)

    row = evaluation.iloc[0]
    assert row["evaluation_status"] == "missing_ground_truth"
    assert row["correctness_score"] == ""
    assert row["faithfulness_score"] == ""
    assert row["hallucination_flag"] == "unknown"
    assert metrics.iloc[0]["missing_ground_truth"] == 1


def test_evaluate_answers_marks_missing_chat_result():
    questions = pd.DataFrame([
        {
            "qid": "Q3",
            "question": "Nhà Lý thành lập năm nào?",
            "question_type": "fact_date",
            "expected_answer": "Nhà Lý thành lập năm 1009.",
        }
    ])
    qrels = pd.DataFrame(columns=["qid", "relevance", "verified"])
    chat_results = pd.DataFrame(columns=["qid", "actual_answer", "citations"])

    evaluation, metrics = evaluate_answers(questions, qrels, chat_results)

    row = evaluation.iloc[0]
    assert row["evaluation_status"] == "missing_chat_result"
    assert row["hallucination_flag"] == "unknown"
    assert metrics.iloc[0]["missing_chat_results"] == 1


def test_evaluate_answers_does_not_grade_failed_chat_result():
    questions = pd.DataFrame([
        {
            "qid": "Q4",
            "question": "Nhà Trần thành lập năm nào?",
            "question_type": "fact_date",
            "expected_answer": "Nhà Trần thành lập năm 1225.",
        }
    ])
    qrels = pd.DataFrame(columns=["qid", "relevance", "verified"])
    chat_results = pd.DataFrame([
        {
            "qid": "Q4",
            "actual_answer": "",
            "citations": "[]",
            "status": "error",
            "error": "Connection refused",
        }
    ])

    evaluation, metrics = evaluate_answers(questions, qrels, chat_results)

    row = evaluation.iloc[0]
    assert row["evaluation_status"] == "chat_result_error"
    assert row["correctness_score"] == ""
    assert row["faithfulness_score"] == ""
    assert row["hallucination_flag"] == "unknown"
    assert "Connection refused" in row["judge_notes"]
    assert metrics.iloc[0]["missing_chat_results"] == 1
