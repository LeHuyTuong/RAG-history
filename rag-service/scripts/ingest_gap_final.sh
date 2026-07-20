#!/bin/bash
# ============================================================================
# ingest_gap_final.sh — 22 doc bổ sung (nhân vật/sự kiện/so sánh/trận đánh/văn hóa)
# đóng gap còn thiếu, ingest vào ĐÚNG hệ thống RAG-history (collection rag_chunks).
#
# Nội dung giống hệt bản đã chạy nhầm ở RAG-edu (history_chunks) — copy nguyên văn
# để đưa vào đúng chỗ. buildGraph=true nên mỗi request chậm hơn (Gemma trích thực
# thể + ghi Neo4j Aura) → timeout 300s thay vì 120s.
#
# Cách dùng:
#   bash scripts/ingest_gap_final.sh --dry-run
#   bash scripts/ingest_gap_final.sh
#   bash scripts/ingest_gap_final.sh --url http://127.0.0.1:8002
# ============================================================================
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:8002}"
INGEST_ENDPOINT="$BASE_URL/rag/ingest"
DRY_RUN=false
NEXT_SOURCE_ID=1400

while [[ $# -gt 0 ]]; do
  case "$1" in
    --source-id) NEXT_SOURCE_ID="$2"; shift 2 ;;
    --dry-run) DRY_RUN=true; shift ;;
    --url) BASE_URL="$2"; INGEST_ENDPOINT="$BASE_URL/rag/ingest"; shift 2 ;;
    *) echo "Unknown: $1"; exit 1 ;;
  esac
done

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'
ok()   { echo -e "  ${GREEN}✔${NC} $1"; }
fail() { echo -e "  ${RED}✘${NC} $1"; }
header(){ echo -e "\n${CYAN}━━━ $1 ━━━${NC}"; }

echo "=== Health check ==="
if curl -sf --max-time 5 "$BASE_URL/rag/health" 2>/dev/null | grep -q '"status":"ok"'; then
  ok "RAG OK at $BASE_URL"
else
  echo -e "  ${RED}RAG not reachable${NC}"; exit 1
fi

SID=$NEXT_SOURCE_ID
TOTAL_INGESTED=0

ingest() {
  local title="$1"
  local content="$2"
  local sid=$SID
  ((SID++))

  if [ "$DRY_RUN" = true ]; then
    echo "  [DRY] sourceId=$sid | $title (${#content} chars)"
    return
  fi

  local RESPONSE
  RESPONSE=$(curl -s --max-time 300 -X POST "$INGEST_ENDPOINT" \
    -H "Content-Type: application/json" \
    -d "$(cat <<EOF | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin),ensure_ascii=False))"
{
  "sourceId": $sid,
  "sourceType": "MANUAL_INPUT",
  "title": "$title",
  "documentId": $sid,
  "rawContent": $(echo "$content" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read().strip()))"),
  "metadata": {},
  "settings": {"chunkSize": 800, "chunkOverlap": 120},
  "buildGraph": true
}
EOF
)") || { fail "[$sid] $title — request failed"; return 1; }

  local STATUS
  STATUS=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','FAILED'))" 2>/dev/null || echo "PARSE_ERROR")

  if [ "$STATUS" = "COMPLETED" ]; then
    local CHUNKS
    CHUNKS=$(echo "$RESPONSE" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('chunks',[])))" 2>/dev/null || echo "?")
    TOTAL_INGESTED=$((TOTAL_INGESTED + CHUNKS))
    ok "[$sid] $title → $CHUNKS chunks ingested"
  else
    fail "[$sid] $title → $STATUS | $(echo "$RESPONSE" | head -c 300)"
  fi
}

# ===========================================================================
# 1. NHÂN VẬT CÒN THIẾU (7)
# ===========================================================================
header "1 — NHÂN VẬT CÒN THIẾU"

ingest "Lý Đạo Thành — Thái sư phụ chính thời Lý Nhân Tông" "
Lý Đạo Thành (?-1081) là Thái sư nhà Lý, một trong những đại thần quan trọng nhất triều Lý Thánh Tông và Lý Nhân Tông. Ông từng có mâu thuẫn với Nguyên phi Ỷ Lan, bị giáng chức ra trấn nhậm ở Nghệ An. Năm 1072, vua Lý Nhân Tông lên ngôi khi mới 6 tuổi, triều đình rối ren, Lý Đạo Thành được triệu về kinh, phục chức Thái sư, cùng Ỷ Lan và Lý Thường Kiệt phụ chính, đảm đương việc nước. Ông giữ vai trò quan trọng trong việc ổn định triều chính giai đoạn đầu đời Lý Nhân Tông, trước khi Đại Việt bước vào cuộc kháng chiến chống Tống (1075-1077). Lý Đạo Thành được sử sách đánh giá là vị quan thanh liêm, đặt việc nước lên trên hiềm khích cá nhân.\n"

ingest "Phạm Sư Mạnh — học trò Chu Văn An, đại thần nhà Trần" "
Phạm Sư Mạnh (khoảng 1300-1384) là một trong những học trò xuất sắc nhất của thầy giáo Chu Văn An tại trường Quốc Tử Giám. Ông đỗ đạt và làm quan dưới các triều vua Trần Minh Tông, Trần Hiến Tông, Trần Dụ Tông, giữ chức Nhập nội hành khiển (tương đương tể tướng), nhiều lần đi sứ nhà Nguyên và thị sát biên giới phía Bắc. Phạm Sư Mạnh nổi tiếng với các bài thơ đề khắc trên vách đá tại vùng biên giới Lạng Sơn (như động Nhị Thanh, núi Chi Lăng), thể hiện khí phách và tầm nhìn của một đại thần thời Trần. Ông là gạch nối tiêu biểu giữa truyền thống giáo dục Nho học của Chu Văn An và tầng lớp quan lại trị quốc thời Trần suy vong.\n"

ingest "Nguyễn Thái Học — lãnh tụ Việt Nam Quốc Dân Đảng, khởi nghĩa Yên Bái 1930" "
Nguyễn Thái Học (1902-1930), quê Vĩnh Yên (nay thuộc Vĩnh Phúc), là người sáng lập và lãnh tụ của Việt Nam Quốc Dân Đảng (VNQDĐ), thành lập năm 1927 theo mô hình Trung Hoa Quốc Dân Đảng của Tôn Trung Sơn, chủ trương dùng bạo lực vũ trang lật đổ chính quyền thực dân Pháp. Đêm 9 rạng sáng 10/2/1930, VNQDĐ phát động cuộc khởi nghĩa vũ trang tại Yên Bái cùng một số tỉnh (Phú Thọ, Hải Dương, Thái Bình), nhưng nhanh chóng bị thực dân Pháp đàn áp do thiếu chuẩn bị và tương quan lực lượng quá chênh lệch. Nguyễn Thái Học bị bắt và cùng 12 đồng chí (trong đó có Phó Đức Chính) bị Pháp xử chém tại Yên Bái ngày 17/6/1930, được gọi là 'Ngày tang Yên Bái'. Trước khi hy sinh, ông hô vang câu nói nổi tiếng 'Không thành công thì cũng thành nhân'.\n"

ingest "Hội Tao Đàn — tổ chức văn học do Lê Thánh Tông sáng lập (1495)" "
Hội Tao Đàn (Tao Đàn nhị thập bát Tú) là hội thơ văn do vua Lê Thánh Tông sáng lập năm 1495, quy tụ 28 văn thần giỏi văn chương trong triều, ví như 28 vì sao (nhị thập bát tú) trên bầu trời. Lê Thánh Tông tự xưng là Tao Đàn nguyên súy (chủ soái), đứng đầu hội, cùng các thành viên như Thân Nhân Trung, Đỗ Nhuận xướng họa thơ văn ca ngợi cảnh thái bình thịnh trị, công đức tổ tiên và vẻ đẹp đất nước. Hội Tao Đàn phản ánh sự phát triển rực rỡ của văn học chữ Hán và chữ Nôm cung đình thời Lê sơ, đồng thời thể hiện vai trò của Lê Thánh Tông vừa là minh quân vừa là nhà văn hóa lớn.\n"

ingest "Nguyễn Hoàng xin vào trấn thủ Thuận Hóa (1558)" "
Năm 1558, Nguyễn Hoàng (con thứ của Nguyễn Kim) xin chị gái là Ngọc Bảo (vợ Trịnh Kiểm) tâu xin cho mình vào trấn thủ vùng Thuận Hóa. Nguyên nhân: sau khi anh trai Nguyễn Uông bị Trịnh Kiểm ám hại vì lo sợ họ Nguyễn tranh giành quyền lực, Nguyễn Hoàng lo sợ cùng số phận nên tìm cách rời khỏi Đàng Ngoài. Theo giai thoại, ông đã bí mật hỏi ý kiến Trạng Trình Nguyễn Bỉnh Khiêm và nhận được lời khuyên 'Hoành Sơn nhất đái, vạn đại dung thân' (một dải Hoành Sơn có thể dung thân muôn đời). Trịnh Kiểm đồng ý cho Nguyễn Hoàng vào trấn thủ Thuận Hóa, phần vì muốn đẩy ông đi xa, phần vì cho rằng vùng đất biên viễn khó phát triển. Đây chính là bước khởi đầu cho cơ nghiệp chúa Nguyễn ở Đàng Trong, mở đầu thời kỳ Trịnh-Nguyễn phân tranh.\n"

ingest "Hoàng Hoa Thám (Đề Thám) — thủ lĩnh khởi nghĩa Yên Thế" "
Hoàng Hoa Thám (tên thật Trương Văn Thám, khoảng 1858-1913), còn gọi là Đề Thám, quê gốc Hưng Yên, lớn lên ở Bắc Giang. Ông là thủ lĩnh cuộc khởi nghĩa nông dân Yên Thế (1884-1913) — cuộc kháng chiến chống Pháp kéo dài nhất trong lịch sử Việt Nam cận đại, gần 30 năm. Dựa vào địa hình rừng núi hiểm trở vùng Yên Thế (Bắc Giang), Đề Thám tổ chức nghĩa quân theo lối du kích, nhiều lần đánh bại các cuộc càn quét của quân Pháp, buộc Pháp phải hai lần ký hòa ước tạm thời (1894, 1897) để nghĩa quân được cát cứ một vùng. Ông bị một thuộc hạ phản bội sát hại năm 1913, kết thúc cuộc khởi nghĩa. Hoàng Hoa Thám được xem là biểu tượng của tinh thần bất khuất, mưu lược của nông dân Việt Nam chống thực dân Pháp.\n"

ingest "Duy Tân hội — tổ chức yêu nước do Phan Bội Châu sáng lập (1904)" "
Duy Tân hội là tổ chức yêu nước bí mật do Phan Bội Châu cùng các đồng chí sáng lập năm 1904 tại Quảng Nam, suy tôn Kỳ Ngoại Hầu Cường Để (dòng dõi nhà Nguyễn) làm hội chủ nhằm tăng uy tín, tập hợp lực lượng. Mục tiêu của hội là đánh đuổi thực dân Pháp, khôi phục độc lập, xây dựng một chính thể quân chủ lập hiến. Duy Tân hội chủ trương dựa vào sự giúp đỡ của nước ngoài (ban đầu kỳ vọng vào Nhật Bản, quốc gia châu Á duy nhất đánh thắng một cường quốc phương Tây - Nga - năm 1905), từ đó phát động phong trào Đông Du (1905-1908), đưa thanh niên Việt Nam sang Nhật Bản du học, đào tạo nhân tài chuẩn bị cho công cuộc cứu nước. Phong trào Đông Du và Duy Tân hội bị tan rã sau khi Pháp-Nhật câu kết trục xuất du học sinh Việt Nam năm 1908-1909.\n"

# ===========================================================================
# 2. SỰ KIỆN THEO NĂM (4)
# ===========================================================================
header "2 — SỰ KIỆN THEO NĂM"

ingest "Năm 1418 — Lê Lợi dựng cờ khởi nghĩa Lam Sơn" "
Ngày 7/2/1418 (mùng 2 Tết năm Mậu Tuất), Lê Lợi cùng các hào kiệt tổ chức hội thề Lũng Nhai và chính thức dựng cờ khởi nghĩa tại quê hương Lam Sơn (nay thuộc huyện Thọ Xuân, tỉnh Thanh Hóa), tự xưng là Bình Định Vương. Đây là mốc mở đầu cuộc khởi nghĩa Lam Sơn kéo dài 10 năm (1418-1427) chống lại ách đô hộ của nhà Minh. Giai đoạn đầu, nghĩa quân Lam Sơn gặp nhiều khó khăn, nhiều lần phải rút lui lên núi Chí Linh để bảo toàn lực lượng trước sự truy quét của quân Minh. Từ năm 1424, theo kế sách của Nguyễn Chích, nghĩa quân chuyển hướng vào Nghệ An, dần làm chủ vùng đất rộng lớn, tạo đà cho thắng lợi cuối cùng năm 1427-1428 với sự kiện Lê Lợi lên ngôi hoàng đế, lập ra nhà Lê sơ.\n"

ingest "Năm 1820 — Hội An suy tàn do sông Thu Bồn bồi lấp" "
Khoảng đầu thế kỷ 19 (giai đoạn quanh năm 1820, đầu triều Nguyễn), thương cảng Hội An (Quảng Nam) — từng là trung tâm giao thương quốc tế sầm uất bậc nhất Đông Nam Á trong các thế kỷ 16-18 — bắt đầu suy tàn rõ rệt. Nguyên nhân chính là hiện tượng bồi lấp phù sa của sông Thu Bồn khiến cửa sông Cửa Đại ngày càng cạn, tàu thuyền lớn không thể ra vào cập cảng như trước. Cùng lúc đó, nhà Nguyễn chuyển trọng tâm phát triển cảng biển sang Đà Nẵng (Tourane) vì có vịnh nước sâu thuận lợi hơn cho tàu thuyền lớn. Hai yếu tố này khiến vai trò thương cảng quốc tế của Hội An dần chuyển sang Đà Nẵng trong suốt thế kỷ 19, để lại một Hội An trầm lắng nhưng vẫn giữ nguyên vẹn kiến trúc phố cổ — nền tảng để UNESCO công nhận là Di sản văn hóa thế giới năm 1999.\n"

ingest "Năm 1930 — thành lập Đảng Cộng sản Việt Nam (3/2/1930)" "
Ngày 3/2/1930, tại Cửu Long (Hương Cảng, Hồng Kông), Nguyễn Ái Quốc (Hồ Chí Minh) chủ trì hội nghị hợp nhất ba tổ chức cộng sản ở Việt Nam: Đông Dương Cộng sản Đảng, An Nam Cộng sản Đảng và Đông Dương Cộng sản Liên đoàn, thành lập Đảng Cộng sản Việt Nam. Hội nghị thông qua Chánh cương vắn tắt, Sách lược vắn tắt do Nguyễn Ái Quốc soạn thảo, xác định mục tiêu làm cách mạng tư sản dân quyền và thổ địa cách mạng để đi tới xã hội cộng sản. Sự ra đời của Đảng Cộng sản Việt Nam chấm dứt tình trạng khủng hoảng về đường lối và tổ chức lãnh đạo của phong trào cách mạng Việt Nam đầu thế kỷ 20, mở ra bước ngoặt lịch sử dẫn tới thắng lợi Cách mạng tháng Tám năm 1945.\n"

ingest "Năm 2007 — Việt Nam gia nhập Tổ chức Thương mại Thế giới (WTO)" "
Ngày 11/1/2007, Việt Nam chính thức trở thành thành viên thứ 150 của Tổ chức Thương mại Thế giới (WTO), sau 11 năm đàm phán kể từ khi nộp đơn xin gia nhập năm 1995. Đây là dấu mốc quan trọng đánh dấu Việt Nam hội nhập sâu rộng vào nền kinh tế toàn cầu sau hai thập niên thực hiện chính sách Đổi mới (từ 1986). Việc gia nhập WTO mở ra cơ hội mở rộng thị trường xuất khẩu, thu hút đầu tư nước ngoài, đồng thời đặt ra thách thức cạnh tranh gay gắt hơn cho doanh nghiệp trong nước khi phải tuân thủ các cam kết cắt giảm thuế quan, mở cửa thị trường dịch vụ theo lộ trình đã đàm phán.\n"

# ===========================================================================
# 3. SO SÁNH XUYÊN THỜI KỲ (4)
# ===========================================================================
header "3 — SO SÁNH XUYÊN THỜI KỲ"

ingest "So sánh trận Bạch Đằng 938 và trận Bạch Đằng 1288" "
Trận Bạch Đằng năm 938 (Ngô Quyền đánh quân Nam Hán) và trận Bạch Đằng năm 1288 (Trần Hưng Đạo đánh quân Nguyên Mông) cách nhau 350 năm nhưng có điểm chung nổi bật: cả hai đều lợi dụng địa hình sông Bạch Đằng và quy luật thủy triều lên xuống, cho đóng cọc gỗ nhọn (đầu bịt sắt) ngầm dưới lòng sông, nhử địch vào lúc triều lên rồi đợi triều rút để cọc nhô lên đâm thủng thuyền địch, kết hợp phục binh tiêu diệt. Điểm khác biệt: trận 938 đánh tan quân Nam Hán do Hoằng Tháo chỉ huy, chấm dứt hơn 1.000 năm Bắc thuộc, mở nền độc lập tự chủ cho dân tộc. Trận 1288 đánh tan đạo quân rút lui của Ô Mã Nhi trong cuộc kháng chiến chống Nguyên Mông lần thứ ba, quy mô lực lượng và vũ khí (thuyền chiến, súng) hiện đại hơn nhiều so với thời Ngô Quyền. Cả hai trận đều thể hiện tài thao lược quân sự đặc sắc gắn với địa lợi sông nước của người Việt.\n"

ingest "Điểm tương đồng giữa thất bại của nhà Hồ và sự suy vong của Tây Sơn" "
Nhà Hồ (1400-1407) và triều đại Tây Sơn (1778-1802) đều là những chính quyền tiến hành cải cách hoặc dựng nghiệp một cách nhanh chóng, mạnh mẽ nhưng cuối cùng sụp đổ trong thời gian ngắn. Điểm tương đồng: cả hai đều lên nắm quyền bằng cách thay thế triều đại cũ (Hồ Quý Ly soán ngôi nhà Trần; anh em Tây Sơn lật đổ chúa Nguyễn, chúa Trịnh và vua Lê), nên thiếu tính chính danh vững chắc trong con mắt một bộ phận dân chúng và sĩ phu trung thành với triều cũ. Cả hai đều thiếu thời gian củng cố bộ máy cai trị và xây dựng hậu thuẫn xã hội bền vững trước khi phải đối mặt với thách thức lớn: nhà Hồ bị quân Minh đánh bại chỉ sau 7 năm (1407); còn triều Tây Sơn suy yếu nhanh chóng sau khi vua Quang Trung - trụ cột thực sự - đột ngột qua đời năm 1792, để lại người kế vị còn nhỏ tuổi (Quang Toản) không đủ năng lực giữ vững cơ nghiệp, tạo điều kiện cho Nguyễn Ánh phản công và thống nhất đất nước năm 1802.\n"

ingest "So sánh chính quyền Đàng Trong (chúa Nguyễn) và Đàng Ngoài (chúa Trịnh)" "
Sau khi Trịnh-Nguyễn phân tranh (từ 1627, lấy sông Gianh làm ranh giới từ 1672), hai chính quyền cùng tồn tại song song. Điểm giống nhau: cả hai đều danh nghĩa tôn phò vua Lê, tự nhận là bề tôi triều Lê, cùng dùng niên hiệu vua Lê. Điểm khác biệt: ở Đàng Ngoài, chúa Trịnh lập phủ Chúa bên cạnh triều đình vua Lê (mô hình 'vua Lê - chúa Trịnh'), nắm thực quyền cai trị nhưng vẫn duy trì triều đình vua Lê như một biểu tượng; bộ máy hành chính kế thừa nhiều từ thời Lê sơ. Ở Đàng Trong, chúa Nguyễn cai trị độc lập hơn trên thực tế, không có một triều đình vua Lê song song tại chỗ, tự tổ chức bộ máy hành chính riêng, đồng thời đẩy mạnh công cuộc mở mang bờ cõi về phía Nam (Nam tiến), sáp nhập dần vùng đất Chiêm Thành và Nam Bộ. Đàng Trong cũng cởi mở hơn với giao thương quốc tế (qua thương cảng Hội An) so với chính sách có phần dè dặt hơn của Đàng Ngoài.\n"

ingest "So sánh chữ Nôm thời Trần và chữ Quốc ngữ thế kỷ 17" "
Chữ Nôm và chữ Quốc ngữ là hai hệ chữ viết ghi âm tiếng Việt ra đời cách nhau nhiều thế kỷ. Chữ Nôm hình thành từ trước, phát triển mạnh vào thời Trần (thế kỷ 13-14), được xây dựng trên cơ sở mượn hoặc biến đổi các chữ Hán để ghi âm tiếng Việt (theo nguyên tắc hình - thanh, hội ý...). Thời Trần, chữ Nôm đã được dùng để sáng tác văn học, tiêu biểu là các tác phẩm của Nguyễn Thuyên (Hàn Thuyên) - người được xem là đặt nền móng cho thơ Nôm. Tuy nhiên, chữ Nôm rất phức tạp, khó học vì phải thông thạo chữ Hán trước, nên chỉ phổ biến trong giới trí thức. Chữ Quốc ngữ ra đời thế kỷ 17, do các giáo sĩ phương Tây (tiêu biểu là Alexandre de Rhodes, người xuất bản Từ điển Việt-Bồ-La năm 1651) La-tinh hóa cách ghi âm tiếng Việt bằng chữ cái La-tinh kèm dấu thanh điệu. Ban đầu chữ Quốc ngữ chỉ dùng trong phạm vi truyền giáo, nhưng nhờ tính đơn giản, dễ học hơn nhiều so với chữ Nôm và chữ Hán, đến đầu thế kỷ 20 nó dần thay thế hoàn toàn, trở thành chữ viết chính thức của người Việt.\n"

# ===========================================================================
# 4. TRẬN ĐÁNH & QUÂN SỰ (4)
# ===========================================================================
header "4 — TRẬN ĐÁNH & QUÂN SỰ"

ingest "Trận cửa Thuận An 1883 — Pháp tấn công cửa ngõ Huế" "
Tháng 8/1883, quân Pháp do Đô đốc Amédée Courbet chỉ huy đưa hạm đội tấn công trực tiếp vào cửa Thuận An - cửa ngõ đường biển bảo vệ kinh thành Huế. Sau các trận pháo kích và đổ bộ ác liệt (18-20/8/1883), các đồn lũy phòng thủ ở Thuận An thất thủ. Đây là đòn quân sự trực tiếp và nghiêm trọng nhất đánh vào kinh đô triều Nguyễn, khiến triều đình Huế (khi đó vua Hiệp Hòa mới lên ngôi sau khi vua Tự Đức qua đời) hoảng loạn và phải chấp nhận đàm phán. Ngày 25/8/1883, triều Nguyễn buộc phải ký Hiệp ước Harmand (Hòa ước Quý Mùi) công nhận nền bảo hộ của Pháp trên toàn cõi Việt Nam, đặt Bắc Kỳ và Trung Kỳ dưới sự kiểm soát của Pháp, chỉ còn giữ hình thức tự trị hạn chế. Trận Thuận An được xem là bước ngoặt đánh dấu triều Nguyễn chính thức mất chủ quyền vào tay thực dân Pháp.\n"

ingest "Tổ chức quân đội thời Lý — cấm quân, lộ quân và Ngụ binh ư nông" "
Quân đội nhà Lý (1009-1225) được tổ chức khá quy củ, gồm hai bộ phận chính: cấm quân (còn gọi là thiên tử binh) đóng tại kinh đô Thăng Long, chuyên bảo vệ vua và triều đình, được tuyển chọn kỹ càng, luyện tập thường xuyên; và quân địa phương (lộ quân, phủ quân) đóng tại các lộ, phủ, có nhiệm vụ giữ gìn an ninh địa phương và sẵn sàng điều động khi có chiến sự. Nhà Lý áp dụng chính sách 'Ngụ binh ư nông' (gửi binh lính vào nông nghiệp): binh lính thay phiên nhau, một phần thường trực luyện tập, phần lớn còn lại được cho về quê làm ruộng, khi cần thì gọi ra ứng chiến. Chính sách này giúp vừa duy trì lực lượng quân sự đông đảo, vừa không ảnh hưởng lớn đến sản xuất nông nghiệp, giảm gánh nặng nuôi quân thường trực cho triều đình. Nhờ tổ chức quân đội hợp lý, nhà Lý đã giành thắng lợi trong cuộc kháng chiến chống Tống (1075-1077).\n"

ingest "Quân lực Việt Nam Cộng hòa — tổ chức và trang bị" "
Quân lực Việt Nam Cộng hòa (QLVNCH) là lực lượng vũ trang của chính quyền Việt Nam Cộng hòa (1955-1975), được tổ chức theo mô hình quân đội hiện đại với ba quân chủng: Lục quân (bộ binh, biệt động quân, thiết giáp, dù, thủy quân lục chiến), Không quân và Hải quân. Quân số vào giai đoạn cao điểm (đầu thập niên 1970) lên tới hơn 1 triệu người. Về trang bị, QLVNCH được Hoa Kỳ viện trợ và huấn luyện, sử dụng vũ khí bộ binh (súng M16, M60), pháo binh, xe tăng - thiết giáp (M41, M113), máy bay chiến đấu (A-37, F-5) và tàu chiến do Mỹ chuyển giao, đặc biệt tăng mạnh trong khuôn khổ chương trình 'Việt Nam hóa chiến tranh' (1969-1973) khi Mỹ rút quân và chuyển giao trách nhiệm chiến đấu. Tuy trang bị hiện đại, QLVNCH gặp nhiều vấn đề về tinh thần chiến đấu, nạn tham nhũng và phụ thuộc lớn vào viện trợ Mỹ, dẫn đến sự sụp đổ nhanh chóng trong Chiến dịch Hồ Chí Minh năm 1975.\n"

ingest "Bộ đội Cụ Hồ — hình ảnh và tư tưởng về quân đội nhân dân" "
'Bộ đội Cụ Hồ' là danh xưng thân thương mà nhân dân Việt Nam dành cho Quân đội Nhân dân Việt Nam, gắn liền với tên gọi và tư tưởng của Chủ tịch Hồ Chí Minh - người sáng lập quân đội (thành lập Đội Việt Nam Tuyên truyền Giải phóng quân ngày 22/12/1944). Khái niệm 'Bộ đội Cụ Hồ' không chỉ đơn thuần là tên gọi mà thể hiện một hệ giá trị, phẩm chất: quân đội từ nhân dân mà ra, vì nhân dân mà chiến đấu, gắn bó máu thịt với nhân dân ('quân với dân như cá với nước'), có kỷ luật nghiêm minh nhưng đối xử nhân ái, giúp dân trong sản xuất và đời sống, chiến đấu dũng cảm nhưng không tàn bạo với tù binh và dân thường. Hình ảnh 'Bộ đội Cụ Hồ' trở thành biểu tượng tinh thần xuyên suốt hai cuộc kháng chiến chống Pháp và chống Mỹ, được xem là một trong những nhân tố quan trọng lý giải vì sao một quân đội trang bị còn hạn chế có thể chiến thắng các đối phương có tiềm lực quân sự vượt trội.\n"

# ===========================================================================
# 5. VĂN HÓA (3)
# ===========================================================================
header "5 — VĂN HÓA"

ingest "Dư địa chí — tác phẩm địa lý học đầu tiên của Nguyễn Trãi" "
Dư địa chí (còn gọi là Ức Trai dư địa chí hay An Nam vũ cống) là tác phẩm do Nguyễn Trãi biên soạn năm 1435, dâng lên vua Lê Thái Tông, được xem là tác phẩm địa lý học đầu tiên của Việt Nam. Sách ghi chép về cương vực, núi sông, sản vật, phong tục tập quán của các đạo, phủ, huyện trong nước thời bấy giờ, đồng thời có phần đối chiếu với một số nước lân bang. Ngoài giá trị địa lý - lịch sử, Dư địa chí còn thể hiện tư tưởng của Nguyễn Trãi về chủ quyền lãnh thổ và ý thức xây dựng một hệ thống tri thức về đất nước phục vụ việc trị quốc. Tác phẩm được các danh sĩ đời sau như Nguyễn Thiên Túng, Nguyễn Thiên Tích, Lý Tử Tấn chú giải thêm, cho thấy tầm ảnh hưởng lâu dài của tác phẩm trong nền học thuật phong kiến Việt Nam.\n"

ingest "Cung oán ngâm khúc — tác phẩm của Nguyễn Gia Thiều" "
Cung oán ngâm khúc là tác phẩm thơ Nôm nổi tiếng của Nguyễn Gia Thiều (1741-1798), sáng tác vào khoảng giữa thế kỷ 18. Tác phẩm viết theo thể song thất lục bát, dài 356 câu, mượn lời một cung nữ bị vua ruồng bỏ để bộc lộ nỗi oán hận, buồn tủi về thân phận, đồng thời gửi gắm triết lý nhân sinh mang màu sắc Phật giáo và Lão giáo về sự vô thường, phù du của kiếp người và danh lợi. Về nghệ thuật, Cung oán ngâm khúc được đánh giá là đỉnh cao của thể loại ngâm khúc trong văn học trung đại Việt Nam, với ngôn ngữ trau chuốt, giàu hình ảnh ước lệ, sử dụng nhiều điển cố điển tích. Tác phẩm, cùng với Chinh phụ ngâm (Đặng Trần Côn - Đoàn Thị Điểm), là hai kiệt tác tiêu biểu nhất của dòng văn học ngâm khúc than thân trách phận thời kỳ phong kiến suy tàn.\n"

ingest "Vai trò của nhà sư trong việc chép sử thời Lý-Trần" "
Dưới thời Lý-Trần (thế kỷ 11-14), khi Phật giáo được xem là quốc giáo, các nhà sư (thiền sư) không chỉ đảm nhận vai trò tôn giáo mà còn tham gia sâu vào đời sống chính trị, văn hóa và học thuật, trong đó có việc ghi chép, biên soạn sử liệu. Tiêu biểu, thiền sư Đỗ Thuận và thiền sư Vạn Hạnh từng là cố vấn chính trị thân cận của các vua đầu triều Lý (Vạn Hạnh có công lớn trong việc đưa Lý Công Uẩn lên ngôi năm 1009). Các thiền viện thời Lý-Trần cũng là nơi lưu trữ và biên soạn nhiều tác phẩm ghi chép về các thiền sư, phả hệ Phật giáo, tiêu biểu là bộ 'Thiền uyển tập anh' (biên soạn cuối thời Trần) - một trong những tư liệu sớm nhất ghi chép về lịch sử Phật giáo và một phần lịch sử chính trị - xã hội Việt Nam thời Lý. Do triều đình chưa có cơ quan chép sử chuyên trách hoàn chỉnh trong giai đoạn đầu, các chùa chiền và tăng sĩ đã đóng vai trò quan trọng như những trung tâm lưu giữ tri thức và sử liệu của dân tộc.\n"

# ===========================================================================
# SUMMARY
# ===========================================================================
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           INGEST GAP FINAL (RAG-history) COMPLETE          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
if [ "$DRY_RUN" = true ]; then
  echo ""
  echo "  DRY RUN hoàn tất. Bỏ --dry-run để ingest thật."
  echo "  Tổng số: $((SID - NEXT_SOURCE_ID)) documents"
else
  echo ""
  echo "  ✅ Tổng documents ingested: $((SID - NEXT_SOURCE_ID))"
  echo "  ✅ Tổng chunks ingested: $TOTAL_INGESTED"
  echo "  ✅ Collection: rag_chunks (+ Neo4j graph nếu buildGraph thành công)"
fi