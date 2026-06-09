% Preliminary silver-label pilot results. Labels are silver and not manually verified.
\begin{tabular}{llrrrrrr}
\toprule
method & num_queries & recall_at_5 & recall_at_10 & mrr_at_10 & evidence_hit_rate_at_5 & citation_accuracy_at_5 & no_answer_accuracy \\
\midrule
bm25 & 40 & 0.6842 & 0.7368 & 0.5877 & 0.6842 & 0.6842 & 0.0000 \\
e5 & 40 & 0.1579 & 0.2368 & 0.1118 & 0.1579 & 0.1842 & 0.0000 \\
hybrid_e5 & 40 & 0.6053 & 0.7105 & 0.4119 & 0.6053 & 0.6053 & 0.0000 \\
\bottomrule
\end{tabular}
