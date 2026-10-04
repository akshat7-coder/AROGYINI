import build_index


def test_collect_skips_empty_files_and_normalises_whitespace(monkeypatch, tmp_path, capsys):
    (tmp_path / "THEDOWRYPROHIBITIONACT1961_0.txt").write_text("Dowry   means\n\nany property.", encoding="utf-8")
    (tmp_path / "The_Criminal_Law_Amendment_Act_2013_0.txt").write_text("", encoding="utf-8")
    (tmp_path / "whitespace_only.txt").write_text("   \n\t\n", encoding="utf-8")
    (tmp_path / "requirements.txt").write_text("fastapi\n", encoding="utf-8")
    monkeypatch.setattr(build_index, "ROOT", tmp_path)
    monkeypatch.setattr(build_index, "PDF_DIR", tmp_path / "data" / "pdfs")

    docs = build_index.collect()

    assert [p.name for p, _ in docs] == ["THEDOWRYPROHIBITIONACT1961_0.txt"]
    assert docs[0][1] == "Dowry means any property."
    warnings = capsys.readouterr().out
    assert "The_Criminal_Law_Amendment_Act_2013_0.txt" in warnings
    assert "whitespace_only.txt" in warnings
